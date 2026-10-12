import { test } from "node:test";
import assert from "node:assert/strict";
import { ocurreEn } from "./recurrenceUtils.ts";

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
