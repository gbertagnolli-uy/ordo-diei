import { test } from "node:test";
import assert from "node:assert/strict";
import {
  describirRotacion,
  esTareaVisibleParaUsuarioEnDia,
  normalizarRotacionConfig,
  ocurreRotacionEn,
  primeraAsignacionRotativa,
  responsableEnDia,
  responsablesEnDia,
  type RotacionConfig,
} from "./rotacionTarea.ts";

test("rotación por frecuencia diaria: cada 1 día y cada 3 días entre 3 responsables", () => {
  const configCada1: RotacionConfig = {
    modo: "frecuencia",
    responsablesIds: [10, 20, 30],
    cada: 1,
    unidad: "dias",
    fechaInicio: "2026-10-12", // Lunes
  };

  assert.equal(responsableEnDia(configCada1, new Date(2026, 9, 12)), 10);
  assert.equal(responsableEnDia(configCada1, new Date(2026, 9, 13)), 20);
  assert.equal(responsableEnDia(configCada1, new Date(2026, 9, 14)), 30);
  assert.equal(responsableEnDia(configCada1, new Date(2026, 9, 15)), 10);

  const configCada3: RotacionConfig = {
    modo: "frecuencia",
    responsablesIds: [10, 20],
    cada: 3,
    unidad: "dias",
    fechaInicio: "2026-10-12",
  };

  // Días 0, 1, 2 -> usuario 10; Días 3, 4, 5 -> usuario 20; Día 6 -> usuario 10
  assert.equal(responsableEnDia(configCada3, new Date(2026, 9, 12)), 10);
  assert.equal(responsableEnDia(configCada3, new Date(2026, 9, 13)), 10);
  assert.equal(responsableEnDia(configCada3, new Date(2026, 9, 14)), 10);
  assert.equal(responsableEnDia(configCada3, new Date(2026, 9, 15)), 20);
  assert.equal(responsableEnDia(configCada3, new Date(2026, 9, 16)), 20);
  assert.equal(responsableEnDia(configCada3, new Date(2026, 9, 17)), 20);
  assert.equal(responsableEnDia(configCada3, new Date(2026, 9, 18)), 10);
});

test("rotación por frecuencia semanal y mensual", () => {
  const semanalCada2: RotacionConfig = {
    modo: "frecuencia",
    responsablesIds: [1, 2],
    cada: 2,
    unidad: "semanas",
    fechaInicio: "2026-10-01",
  };

  // Primeras 2 semanas (14 días: 1 al 14 oct) -> usuario 1
  assert.equal(responsableEnDia(semanalCada2, new Date(2026, 9, 1)), 1);
  assert.equal(responsableEnDia(semanalCada2, new Date(2026, 9, 14)), 1);
  // Siguientes 2 semanas (15 al 28 oct) -> usuario 2
  assert.equal(responsableEnDia(semanalCada2, new Date(2026, 9, 15)), 2);
  assert.equal(responsableEnDia(semanalCada2, new Date(2026, 9, 28)), 2);
  // Semana 5 (29 oct) -> vuelve a usuario 1
  assert.equal(responsableEnDia(semanalCada2, new Date(2026, 9, 29)), 1);

  const mensualCada1: RotacionConfig = {
    modo: "frecuencia",
    responsablesIds: [5, 6, 7],
    cada: 1,
    unidad: "meses",
    fechaInicio: "2026-10-01",
  };

  assert.equal(responsableEnDia(mensualCada1, new Date(2026, 9, 25)), 5); // Octubre
  assert.equal(responsableEnDia(mensualCada1, new Date(2026, 10, 5)), 6); // Noviembre
  assert.equal(responsableEnDia(mensualCada1, new Date(2026, 11, 31)), 7); // Diciembre
  assert.equal(responsableEnDia(mensualCada1, new Date(2027, 0, 1)), 5); // Enero 2027
});

test("rotación por días de la semana para cada responsable", () => {
  const porDias: RotacionConfig = {
    modo: "dias_semana",
    responsablesIds: [11, 22],
    diasPorUsuario: {
      "11": [1, 3, 5], // Lun, Mié, Vie
      "22": [2, 4], // Mar, Jue
    },
    fechaInicio: "2026-10-11", // Domingo
  };

  assert.equal(responsableEnDia(porDias, new Date(2026, 9, 11)), null); // Domingo: nadie
  assert.equal(responsableEnDia(porDias, new Date(2026, 9, 12)), 11); // Lunes: 11
  assert.equal(responsableEnDia(porDias, new Date(2026, 9, 13)), 22); // Martes: 22
  assert.equal(responsableEnDia(porDias, new Date(2026, 9, 14)), 11); // Miércoles: 11
  assert.equal(responsableEnDia(porDias, new Date(2026, 9, 15)), 22); // Jueves: 22
  assert.equal(responsableEnDia(porDias, new Date(2026, 9, 16)), 11); // Viernes: 11
  assert.equal(responsableEnDia(porDias, new Date(2026, 9, 17)), null); // Sábado: nadie

  const regla = {
    tipoRecurrencia: "Diaria",
    fechaVencimiento: new Date(2026, 9, 11),
    rotacionConfig: porDias,
  };
  assert.equal(ocurreRotacionEn(regla, new Date(2026, 9, 11)), false);
  assert.equal(ocurreRotacionEn(regla, new Date(2026, 9, 12)), true);

  // Si se crea el domingo 11, la primera asignación debe caer el lunes 12 para el usuario 11
  const primera = primeraAsignacionRotativa(regla, new Date(2026, 9, 11));
  assert.ok(primera);
  assert.equal(primera.asignadoId, 11);
  assert.equal(primera.fecha.getFullYear(), 2026);
  assert.equal(primera.fecha.getMonth(), 9);
  assert.equal(primera.fecha.getDate(), 12);
});

test("visibilidad: la tarea rotativa solo aparece al responsable asignado en el día asignado", () => {
  const config: RotacionConfig = {
    modo: "frecuencia",
    responsablesIds: [1, 2],
    cada: 1,
    unidad: "dias",
    fechaInicio: "2026-10-12", // Lun 12 -> usuario 1, Mar 13 -> usuario 2
  };

  const lunes = new Date(2026, 9, 12, 10, 0, 0);
  const martes = new Date(2026, 9, 13, 10, 0, 0);

  const tareaLunes = {
    asignadoId: 1,
    estado: "Pendiente",
    fechaVencimiento: new Date(2026, 9, 12),
    rotacionConfig: config,
  };

  // El lunes 12 solo la ve el usuario 1; el usuario 2 no la ve
  assert.equal(esTareaVisibleParaUsuarioEnDia(tareaLunes, 1, lunes), true);
  assert.equal(esTareaVisibleParaUsuarioEnDia(tareaLunes, 2, lunes), false);

  // El martes 13, la tarea del lunes ya no le aparece como activa al usuario 1
  assert.equal(esTareaVisibleParaUsuarioEnDia(tareaLunes, 1, martes), false);

  // Pero si el usuario 1 la completó el lunes, sigue visible en su historial/revisión
  const tareaCompletada = { ...tareaLunes, estado: "Aprobada" };
  assert.equal(esTareaVisibleParaUsuarioEnDia(tareaCompletada, 1, martes), true);
});

test("normalizarRotacionConfig y describirRotacion", () => {
  assert.equal(normalizarRotacionConfig(null), null);
  assert.equal(normalizarRotacionConfig({ modo: "invalido" }), null);

  const cfg = normalizarRotacionConfig({
    modo: "frecuencia",
    responsablesIds: ["1", 2, 1],
    cada: "2",
    unidad: "semanas",
  });
  assert.deepEqual(cfg, {
    modo: "frecuencia",
    responsablesIds: [1, 2],
    cada: 2,
    unidad: "semanas",
  });
  assert.equal(describirRotacion(cfg), "Rotativa · cada 2 semanas");
});

test("permite más de un responsable por día en selección de día de la semana (tareas en grupo)", () => {
  const configGrupal: RotacionConfig = {
    modo: "dias_semana",
    responsablesIds: [100, 200, 300],
    diasPorUsuario: {
      "100": [1, 5],    // Lunes y Viernes
      "200": [1, 3],    // Lunes y Miércoles (Lunes compartido con 100!)
      "300": [2, 4],    // Martes y Jueves
    },
    fechaInicio: "2026-10-12", // Lunes 12 de oct
  };

  const lunes = new Date(2026, 9, 12);
  const martes = new Date(2026, 9, 13);
  const miercoles = new Date(2026, 9, 14);

  // En lunes 12, tanto 100 como 200 son responsables
  const respLunes = responsablesEnDia(configGrupal, lunes);
  assert.deepEqual(respLunes, [100, 200]);

  // En martes 13, solo 300
  const respMartes = responsablesEnDia(configGrupal, martes);
  assert.deepEqual(respMartes, [300]);

  // En miércoles 14, solo 200
  const respMiercoles = responsablesEnDia(configGrupal, miercoles);
  assert.deepEqual(respMiercoles, [200]);

  // Visibilidad el lunes: tanto 100 como 200 ven sus respectivas tareas asignadas
  const tarea100 = {
    asignadoId: 100,
    estado: "Pendiente",
    fechaVencimiento: lunes,
    rotacionConfig: configGrupal,
  };
  const tarea200 = {
    asignadoId: 200,
    estado: "Pendiente",
    fechaVencimiento: lunes,
    rotacionConfig: configGrupal,
  };
  const tarea300 = {
    asignadoId: 300,
    estado: "Pendiente",
    fechaVencimiento: lunes,
    rotacionConfig: configGrupal,
  };

  assert.equal(esTareaVisibleParaUsuarioEnDia(tarea100, 100, lunes), true);
  assert.equal(esTareaVisibleParaUsuarioEnDia(tarea200, 200, lunes), true);
  assert.equal(esTareaVisibleParaUsuarioEnDia(tarea300, 300, lunes), false);

  // Descripción indica tarea en grupo
  assert.equal(describirRotacion(configGrupal), "Rotativa · días asignados (en grupo)");
});

