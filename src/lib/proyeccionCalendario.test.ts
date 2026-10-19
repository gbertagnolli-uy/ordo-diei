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

test("proyectarEventosCalendario maneja más de un responsable por día (tareas en grupo)", () => {
  const rangoInicio = new Date(2026, 9, 12); // Lunes
  const rangoFin = new Date(2026, 9, 14); // Miércoles

  // El lunes 12 están asignados TANTO Juan (1) como María (2)
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
  // Lunes: 2 eventos (uno para Juan y uno para María). Martes: 1 evento (María). Total = 3
  assert.equal(eventos.length, 3);

  const eventosLunes = eventos.filter((e) => e.start.getDay() === 1);
  assert.equal(eventosLunes.length, 2);
  const asignadosLunes = eventosLunes.map((e) => e.resource.asignadoId).sort();
  assert.deepEqual(asignadosLunes, [1, 2]);

  // Filtro por tipo de tarea: grupal
  const soloGrupales = proyectarEventosCalendario([tareaGrupal], usuarios, rangoInicio, rangoFin, { tipoTarea: "grupal" });
  // El lunes tiene 2 responsables por lo que es grupal
  assert.ok(soloGrupales.length >= 2);
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
