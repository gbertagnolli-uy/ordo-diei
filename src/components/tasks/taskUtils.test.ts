import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dueDate,
  formatDue,
  isDueToday,
  taskAppliesOnDay,
  sortTasks,
} from "./taskUtils.ts";
import type { RotacionConfig } from "../../lib/rotacionTarea.ts";

test("dueDate y taskAppliesOnDay calculan fechas reales para plantillas recurrentes y rotativas", () => {
  // Lunes 12 de octubre de 2026
  const lunes = new Date(2026, 9, 12, 10, 0, 0);

  // 1. Tarea única con fecha estática
  const tareaUnica = {
    id: 1,
    titulo: "Comprar pan",
    asignadoId: 10,
    tipoRecurrencia: "Unica",
    fechaVencimiento: lunes,
    horaEjecucion: lunes,
  };
  assert.equal(taskAppliesOnDay(tareaUnica, lunes, 10), true);
  assert.equal(taskAppliesOnDay(tareaUnica, lunes, 20), false);
  const martes = new Date(2026, 9, 13);
  assert.equal(taskAppliesOnDay(tareaUnica, martes, 10), false);

  // 2. Tarea recurrente semanal (los viernes) creada hace 2 semanas
  const viernesPasado = new Date(2026, 8, 25);
  const tareaSemanalViernes = {
    id: 2,
    titulo: "Sacar basura",
    asignadoId: 10,
    tipoRecurrencia: "Semanal",
    diaDeLaSemana: 5, // Viernes
    fechaVencimiento: viernesPasado, // fecha de creación antigua
    anclaFecha: viernesPasado,
    horaEjecucion: new Date(2026, 8, 25, 18, 0, 0),
  };
  // Si evaluamos desde el lunes 12 oct 2026, su próximo vencimiento debe ser el viernes 16 oct 2026 a las 18:00
  const proxVenc = dueDate(tareaSemanalViernes, lunes);
  assert.ok(proxVenc);
  assert.equal(proxVenc.getDay(), 5); // Viernes
  assert.equal(proxVenc.getDate(), 16);
  assert.equal(proxVenc.getHours(), 18);

  // Aplica el viernes 16, no el lunes 12
  const viernes16 = new Date(2026, 9, 16);
  assert.equal(taskAppliesOnDay(tareaSemanalViernes, lunes, 10), false);
  assert.equal(taskAppliesOnDay(tareaSemanalViernes, viernes16, 10), true);

  // 3. Tarea rotativa por días de semana (10 los lunes, 20 los martes) creada el domingo 11 oct
  const rotConfig: RotacionConfig = {
    modo: "dias_semana",
    responsablesIds: [10, 20],
    diasPorUsuario: {
      "10": [1], // Lunes
      "20": [2], // Martes
    },
    fechaInicio: "2026-10-11",
  };
  const tareaRotativa = {
    id: 3,
    titulo: "Barrer patio",
    asignadoId: 10,
    tipoRecurrencia: "Unica",
    rotacionConfig: rotConfig,
    fechaVencimiento: new Date(2026, 9, 11), // Domingo 11 (creación)
  };

  // El lunes 12 le toca a 10
  assert.equal(taskAppliesOnDay(tareaRotativa, lunes, 10), true);
  assert.equal(taskAppliesOnDay(tareaRotativa, lunes, 20), false);

  // El martes 13 le toca a 20
  assert.equal(taskAppliesOnDay(tareaRotativa, martes, 20), true);
  assert.equal(taskAppliesOnDay(tareaRotativa, martes, 10), false);

  // formatDue en onDay formatea la fecha del día seleccionado
  const fmtLunes = formatDue(tareaRotativa, false, lunes);
  assert.ok(fmtLunes);
});

test("sortTasks ordena según la próxima fecha real", () => {
  const hoy = new Date();
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  const pasadoManana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 2);

  const t1 = { id: 1, titulo: "Para pasado mañana", fechaVencimiento: pasadoManana, tipoRecurrencia: "Unica" };
  const t2 = { id: 2, titulo: "Para mañana", fechaVencimiento: manana, tipoRecurrencia: "Unica" };

  const ordenadas = sortTasks([t1, t2], null);
  assert.equal(ordenadas[0].id, 2);
  assert.equal(ordenadas[1].id, 1);
});
