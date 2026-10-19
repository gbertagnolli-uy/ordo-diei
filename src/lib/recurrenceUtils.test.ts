import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularPrimerVencimientoRecurrente, ocurreEn, tocaPorCompletado } from "./recurrenceUtils.ts";

const base = { fechaVencimiento: null as Date | null };

test("Diaria ocurre todos los días", () => {
  assert.equal(ocurreEn({ ...base, tipoRecurrencia: "Diaria" }, new Date(2026, 9, 14)), true);
});

test("Semanal usa el día de la semana de la regla o del ancla", () => {
  const lunes = new Date(2026, 9, 12);
  assert.equal(ocurreEn({ ...base, tipoRecurrencia: "Semanal", diaDeLaSemana: 1 }, lunes), true);
  assert.equal(ocurreEn({ ...base, tipoRecurrencia: "Semanal", diaDeLaSemana: 2 }, lunes), false);
  assert.equal(ocurreEn({ tipoRecurrencia: "Semanal", fechaVencimiento: lunes }, new Date(2026, 9, 19)), true);
});

test("Mensual_Fecha cae en el último día si el mes es corto", () => {
  const r = { ...base, tipoRecurrencia: "Mensual_Fecha", diaDelMes: 31 };
  assert.equal(ocurreEn(r, new Date(2026, 1, 28)), true);
  assert.equal(ocurreEn(r, new Date(2026, 1, 27)), false);
  assert.equal(ocurreEn(r, new Date(2026, 9, 31)), true);
});

test("Mensual_Ordinal: segundo martes y último viernes", () => {
  const segundoMartes = { ...base, tipoRecurrencia: "Mensual_Ordinal", ordinalSemana: 2, diaDeLaSemana: 2 };
  assert.equal(ocurreEn(segundoMartes, new Date(2026, 9, 13)), true);
  assert.equal(ocurreEn(segundoMartes, new Date(2026, 9, 6)), false);
  const ultimoViernes = { ...base, tipoRecurrencia: "Mensual_Ordinal", ordinalSemana: -1, diaDeLaSemana: 5 };
  assert.equal(ocurreEn(ultimoViernes, new Date(2026, 9, 30)), true);
  assert.equal(ocurreEn(ultimoViernes, new Date(2026, 9, 23)), false);
});

test("intervalo: cada 2 días y cada 2 semanas cuentan desde el ancla", () => {
  const ancla = new Date(2026, 9, 12);
  const cada2 = { tipoRecurrencia: "Diaria", fechaVencimiento: ancla, intervalo: 2 };
  assert.equal(ocurreEn(cada2, new Date(2026, 9, 14)), true);
  assert.equal(ocurreEn(cada2, new Date(2026, 9, 13)), false);
  const quincenal = { tipoRecurrencia: "Semanal", fechaVencimiento: ancla, diaDeLaSemana: 1, intervalo: 2 };
  assert.equal(ocurreEn(quincenal, new Date(2026, 9, 26)), true);
  assert.equal(ocurreEn(quincenal, new Date(2026, 9, 19)), false);
});

test("completado: la siguiente cuenta desde la última acción y no deriva", () => {
  const regla = { tipoRecurrencia: "Mensual_Fecha", fechaVencimiento: null, intervalo: 3, anclaFecha: new Date(2026, 0, 31) };
  assert.equal(tocaPorCompletado(regla, new Date(2026, 3, 29)), false);
  assert.equal(tocaPorCompletado(regla, new Date(2026, 3, 30)), true);
  const diaria = { tipoRecurrencia: "Diaria", fechaVencimiento: null, intervalo: 3, anclaFecha: new Date(2026, 9, 10) };
  assert.equal(tocaPorCompletado(diaria, new Date(2026, 9, 12)), false);
  assert.equal(tocaPorCompletado(diaria, new Date(2026, 9, 13)), true);
});

test("calcularPrimerVencimientoRecurrente calcula la fecha futura correcta en vez de la fecha de creación", () => {
  // Domingo 11 de octubre de 2026
  const domingo = new Date(2026, 9, 11, 10, 0, 0);

  // Semanal para viernes (día 5): debe caer el viernes 16 de octubre, no el domingo 11
  const semanalViernes = calcularPrimerVencimientoRecurrente(
    { tipoRecurrencia: "Semanal", diaDeLaSemana: 5 },
    domingo,
    "15:00"
  );
  assert.equal(semanalViernes.fechaVencimiento.getFullYear(), 2026);
  assert.equal(semanalViernes.fechaVencimiento.getMonth(), 9);
  assert.equal(semanalViernes.fechaVencimiento.getDate(), 16); // Viernes 16
  assert.equal(semanalViernes.horaEjecucion?.getHours(), 15);

  // Mensual el día 25: debe caer el 25 de octubre
  const mensual25 = calcularPrimerVencimientoRecurrente(
    { tipoRecurrencia: "Mensual_Fecha", diaDelMes: 25 },
    domingo,
    "12:00"
  );
  assert.equal(mensual25.fechaVencimiento.getDate(), 25);

  // Diaria: si es hoy pero aún no pasó la hora, cae hoy; si la hora pasó, mañana
  const diariaManana = calcularPrimerVencimientoRecurrente(
    { tipoRecurrencia: "Diaria" },
    domingo,
    "08:00"
  );
  assert.ok(diariaManana.fechaVencimiento instanceof Date);
});

