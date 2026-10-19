import { test } from "node:test";
import assert from "node:assert/strict";
import {
  proyectarEventosCalendario,
  determinarTipoTarea,
  type UsuarioBasico,
} from "./proyeccionCalendario.ts";
import type { RotacionConfig } from "./rotacionTarea.ts";

const usuarios: UsuarioBasico[] = [
  { id: 1, nombre: "Juan", rolFamiliar: "Hijo" },
  { id: 2, nombre: "María", rolFamiliar: "Hija" },
  { id: 3, nombre: "Pedro", rolFamiliar: "Hijo" },
];

test("determinarTipoTarea clasifica correctamente rotativa, grupal e individual", () => {
  const rotativa = { rotacionConfig: { modo: "frecuencia", responsablesIds: [1, 2] } };
  assert.equal(determinarTipoTarea(rotativa), "rotativa");

  const grupal = { grupoTareaId: "uuid-123" };
  assert.equal(determinarTipoTarea(grupal), "grupal");

  const individual = { asignadoId: 1 };
  assert.equal(determinarTipoTarea(individual), "individual");
});

test("proyectarEventosCalendario expande tareas recurrentes a lo largo de las fechas correctas", () => {
  // Lunes 12 de octubre de 2026
  const rangoInicio = new Date(2026, 9, 12);
  // Domingo 18 de octubre de 2026 (7 días)
  const rangoFin = new Date(2026, 9, 18);

  const tareaDiaria = {
    id: 10,
    titulo: "Hacer la cama",
    asignadoId: 1,
    tipoRecurrencia: "Diaria",
    fechaVencimiento: new Date(2026, 9, 12),
    horaEjecucion: new Date(2026, 9, 12, 9, 0, 0),
    tiempoEjecucionEstimadoSeg: 600,
    generaPuntosYRecompensa: true,
    dificultad: "Facil",
    generadaPorCron: false,
  };

  const eventos = proyectarEventosCalendario([tareaDiaria], usuarios, rangoInicio, rangoFin);
  // Debe aparecer los 7 días de la semana (12 al 18 oct)
  assert.equal(eventos.length, 7);
  for (const ev of eventos) {
    assert.equal(ev.title, "Hacer la cama");
    assert.equal(ev.resource.asignadoId, 1);
  }
});

test("proyectarEventosCalendario proyecta rotativas según los días asignados a cada usuario", () => {
  // Lunes 12 al domingo 18 de octubre de 2026
  const rangoInicio = new Date(2026, 9, 12);
  const rangoFin = new Date(2026, 9, 18);

  const rotacionPorDias: RotacionConfig = {
    modo: "dias_semana",
    responsablesIds: [1, 2],
    diasPorUsuario: {
      "1": [1, 3], // Lun (12 oct), Mié (14 oct)
      "2": [2, 4], // Mar (13 oct), Jue (15 oct)
    },
    fechaInicio: "2026-10-12",
  };

  const tareaRotativa = {
    id: 20,
    titulo: "Lavar platos",
    asignadoId: 1,
    tipoRecurrencia: "Diaria",
    fechaVencimiento: new Date(2026, 9, 12),
    horaEjecucion: new Date(2026, 9, 12, 20, 0, 0),
    tiempoEjecucionEstimadoSeg: 1200,
    generaPuntosYRecompensa: true,
    dificultad: "Media",
    rotacionConfig: rotacionPorDias,
    generadaPorCron: false,
  };

  // Sin filtro de usuario: 4 eventos en total (Lun, Mar, Mié, Jue)
  const todosEventos = proyectarEventosCalendario([tareaRotativa], usuarios, rangoInicio, rangoFin);
  assert.equal(todosEventos.length, 4);

  // Filtro por Usuario 1: solo aparece Lunes y Miércoles
  const eventosU1 = proyectarEventosCalendario([tareaRotativa], usuarios, rangoInicio, rangoFin, { usuarioId: 1 });
  assert.equal(eventosU1.length, 2);
  assert.equal(eventosU1[0].start.getDay(), 1); // Lunes
  assert.equal(eventosU1[1].start.getDay(), 3); // Miércoles
  assert.equal(eventosU1[0].resource.asignadoId, 1);

  // Filtro por Usuario 2: solo aparece Martes y Jueves
  const eventosU2 = proyectarEventosCalendario([tareaRotativa], usuarios, rangoInicio, rangoFin, { usuarioId: 2 });
  assert.equal(eventosU2.length, 2);
  assert.equal(eventosU2[0].start.getDay(), 2); // Martes
  assert.equal(eventosU2[1].start.getDay(), 4); // Jueves
  assert.equal(eventosU2[0].resource.asignadoId, 2);
});

test("proyectarEventosCalendario muestra un solo cuadro por tarea con fotos de los asignados cada día", () => {
  const rangoInicio = new Date(2026, 9, 12); // Lunes
  const rangoFin = new Date(2026, 9, 14); // Miércoles

  // El lunes 12 están asignados TANTO Juan (1) como María (2). El martes solo María (2).
  const rotacionGrupal: RotacionConfig = {
    modo: "dias_semana",
    responsablesIds: [1, 2],
    diasPorUsuario: {
      "1": [1], // Lun
      "2": [1, 2], // Lun y Mar
    },
    fechaInicio: "2026-10-12",
  };

  const tareaGrupal = {
    id: 30,
    titulo: "Limpiar el patio juntos",
    asignadoId: 1,
    tipoRecurrencia: "Diaria",
    fechaVencimiento: new Date(2026, 9, 12),
    rotacionConfig: rotacionGrupal,
    generaPuntosYRecompensa: true,
    dificultad: "Exigente",
    generadaPorCron: false,
  };

  const eventos = proyectarEventosCalendario([tareaGrupal], usuarios, rangoInicio, rangoFin);
  // Un cuadro por tarea por día: Lunes (1 cuadro grupal), Martes (1 cuadro para María). Total = 2 cuadros
  assert.equal(eventos.length, 2);

  // Lunes: un solo cuadro, con ambos responsables
  const eventosLunes = eventos.filter((e) => e.start.getDay() === 1);
  assert.equal(eventosLunes.length, 1);
  const lunes = eventosLunes[0];
  assert.equal(lunes.title, "Limpiar el patio juntos");
  assert.equal(lunes.resource.asignados.length, 2);
  const idsLunes = lunes.resource.asignados.map((u: any) => u.id).sort();
  assert.deepEqual(idsLunes, [1, 2]);

  // Martes: un solo cuadro, con solo María asignada ese día
  const eventosMartes = eventos.filter((e) => e.start.getDay() === 2);
  assert.equal(eventosMartes.length, 1);
  const martes = eventosMartes[0];
  assert.equal(martes.title, "Limpiar el patio juntos");
  assert.equal(martes.resource.asignados.length, 1);
  assert.equal(martes.resource.asignados[0].id, 2);

  // Filtro por Juan (1): debe aparecer el lunes (porque está asignado) pero NO el martes
  const soloJuan = proyectarEventosCalendario([tareaGrupal], usuarios, rangoInicio, rangoFin, { usuarioId: 1 });
  assert.equal(soloJuan.length, 1);
  assert.equal(soloJuan[0].start.getDay(), 1);

  // Filtro por María (2): aparece el lunes y el martes
  const soloMaria = proyectarEventosCalendario([tareaGrupal], usuarios, rangoInicio, rangoFin, { usuarioId: 2 });
  assert.equal(soloMaria.length, 2);

  // Filtro por tipo de tarea: grupal (el lunes tiene 2 responsables)
  const soloGrupales = proyectarEventosCalendario([tareaGrupal], usuarios, rangoInicio, rangoFin, { tipoTarea: "grupal" });
  assert.equal(soloGrupales.length, 1);
  assert.equal(soloGrupales[0].start.getDay(), 1);
});

test("proyectarEventosCalendario unifica tareas concretas en base con grupoTareaId en un solo cuadro", () => {
  const rangoInicio = new Date(2026, 9, 12);
  const rangoFin = new Date(2026, 9, 12);

  // Dos filas en base de datos para una misma tarea compartida
  const t1 = {
    id: 50,
    grupoTareaId: "grupo-compartido-1",
    titulo: "Cocinar juntos",
    asignadoId: 1,
    fechaVencimiento: new Date(2026, 9, 12),
    dificultad: "Media",
    generaPuntosYRecompensa: true,
  };
  const t2 = {
    id: 51,
    grupoTareaId: "grupo-compartido-1",
    titulo: "Cocinar juntos",
    asignadoId: 2,
    fechaVencimiento: new Date(2026, 9, 12),
    dificultad: "Media",
    generaPuntosYRecompensa: true,
  };

  const eventos = proyectarEventosCalendario([t1, t2], usuarios, rangoInicio, rangoFin);
  // Debe haber EXACTAMENTE 1 cuadro en vez de 2
  assert.equal(eventos.length, 1);
  const ev = eventos[0];
  assert.equal(ev.title, "Cocinar juntos");
  assert.equal(ev.resource.asignados.length, 2);
  assert.deepEqual(ev.resource.asignados.map((u: any) => u.id).sort(), [1, 2]);

  // Si se filtra por usuario 1, se muestra el cuadro con los asignados
  const porU1 = proyectarEventosCalendario([t1, t2], usuarios, rangoInicio, rangoFin, { usuarioId: 1 });
  assert.equal(porU1.length, 1);

  // Si se filtra por usuario 3 (Pedro, no asignado), no se muestra
  const porU3 = proyectarEventosCalendario([t1, t2], usuarios, rangoInicio, rangoFin, { usuarioId: 3 });
  assert.equal(porU3.length, 0);
});

test("filtros de calendario por dificultad, recurrencia y recompensas", () => {
  const rangoInicio = new Date(2026, 9, 12);
  const rangoFin = new Date(2026, 9, 12);

  const t1 = {
    id: 101,
    titulo: "Tarea Fácil con Recompensa",
    asignadoId: 1,
    tipoRecurrencia: "Unica",
    fechaVencimiento: new Date(2026, 9, 12),
    dificultad: "Facil",
    generaPuntosYRecompensa: true,
  };

  const t2 = {
    id: 102,
    titulo: "Tarea Difícil sin Recompensa",
    asignadoId: 2,
    tipoRecurrencia: "Diaria",
    fechaVencimiento: new Date(2026, 9, 12),
    dificultad: "Dificil",
    generaPuntosYRecompensa: false,
  };

  const lista = [t1, t2];

  // Filtro por dificultad
  assert.equal(proyectarEventosCalendario(lista, usuarios, rangoInicio, rangoFin, { dificultad: "Facil" }).length, 1);
  assert.equal(proyectarEventosCalendario(lista, usuarios, rangoInicio, rangoFin, { dificultad: "Dificil" }).length, 1);
  assert.equal(proyectarEventosCalendario(lista, usuarios, rangoInicio, rangoFin, { dificultad: "Ardua" }).length, 0);

  // Filtro por recurrencia
  assert.equal(proyectarEventosCalendario(lista, usuarios, rangoInicio, rangoFin, { recurrencia: "unica" }).length, 1);
  assert.equal(proyectarEventosCalendario(lista, usuarios, rangoInicio, rangoFin, { recurrencia: "recurrente" }).length, 1);

  // Filtro por recompensa
  assert.equal(proyectarEventosCalendario(lista, usuarios, rangoInicio, rangoFin, { recompensa: "con_recompensa" }).length, 1);
  assert.equal(proyectarEventosCalendario(lista, usuarios, rangoInicio, rangoFin, { recompensa: "sin_recompensa" }).length, 1);
});

test("plantilla base recurrente o rotativa no proyecta evento espurio en su fecha de creación", () => {
  // Supongamos que la regla semanal se creó el viernes 2 de octubre de 2026
  const fechaCreacion = new Date(2026, 9, 2); // 2 oct 2026 (viernes)
  // Rango de visualización: lunes 12 a domingo 18 de octubre de 2026
  const rangoInicio = new Date(2026, 9, 12);
  const rangoFin = new Date(2026, 9, 18);

  const plantillaSemanalViernes = {
    id: 50,
    titulo: "Limpieza semanal",
    asignadoId: 1,
    tipoRecurrencia: "Semanal",
    diaDeLaSemana: 5, // Viernes
    fechaVencimiento: fechaCreacion,
    anclaFecha: fechaCreacion,
    generadaPorCron: false,
    parentTaskId: null,
  };

  const eventos = proyectarEventosCalendario([plantillaSemanalViernes], usuarios, rangoInicio, rangoFin);
  // En la semana del 12 al 18 oct, solo debe proyectarse el viernes 16 de octubre
  assert.equal(eventos.length, 1);
  assert.equal(eventos[0].start.getDate(), 16);
  assert.equal(eventos[0].start.getMonth(), 9);

  // Y si la tarea rotativa se creó un viernes pero le toca los sábados:
  const rotacionSabados: RotacionConfig = {
    modo: "dias_semana",
    responsablesIds: [1],
    diasPorUsuario: { "1": [6] }, // Solo sábados (6)
    fechaInicio: "2026-10-02", // Viernes 2 oct
  };
  const plantillaRotativaSabado = {
    id: 51,
    titulo: "Lavar auto",
    asignadoId: 1,
    tipoRecurrencia: "Unica",
    rotacionConfig: rotacionSabados,
    fechaVencimiento: new Date(2026, 9, 2), // Viernes 2 oct (fecha de creación, no es sábado)
    generadaPorCron: false,
    parentTaskId: null,
  };

  // Rango del 2 al 4 de octubre
  const rangoOct = new Date(2026, 9, 2);
  const rangoOctFin = new Date(2026, 9, 4);
  const evs = proyectarEventosCalendario([plantillaRotativaSabado], usuarios, rangoOct, rangoOctFin);
  // NO debe aparecer el viernes 2 oct (día de creación); SOLO debe aparecer el sábado 3 oct
  assert.equal(evs.length, 1);
  assert.equal(evs[0].start.getDay(), 6); // Sábado
  assert.equal(evs[0].start.getDate(), 3);
});
