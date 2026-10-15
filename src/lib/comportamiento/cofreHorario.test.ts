import test from "node:test";
import assert from "node:assert/strict";
import { cofreDeHoy, DIA_MS, estadoCofre, formatearRestante, mismoDia } from "./cofreHorario.ts";

// 2026-10-13 18:00 en UTC-3 = 21:00 UTC
const A_LAS_18 = Date.UTC(2026, 9, 13, 21, 0, 0);

test("las 18:00 de la familia son las 21:00 UTC, incluso pasada la medianoche UTC", () => {
  assert.equal(cofreDeHoy(Date.UTC(2026, 9, 13, 12, 0, 0)), A_LAS_18); // 09:00 locales
  assert.equal(cofreDeHoy(Date.UTC(2026, 9, 14, 1, 0, 0)), A_LAS_18); // 22:00 locales, ya es 14 en UTC
  assert.equal(cofreDeHoy(Date.UTC(2026, 9, 14, 2, 59, 0)), A_LAS_18); // 23:59 locales
  assert.equal(cofreDeHoy(Date.UTC(2026, 9, 14, 3, 0, 0)), A_LAS_18 + DIA_MS); // 00:00 locales del 14
});

test("antes de las 18:00 está en cuenta regresiva y la barra se vacía", () => {
  const e = estadoCofre(A_LAS_18 - DIA_MS / 2, true);
  assert.equal(e.fase, "cuenta");
  assert.equal(e.progreso, 0.5);
  assert.equal(estadoCofre(A_LAS_18 - 1000, true).fase, "cuenta");
  // a las 00:00 locales faltan 18 h: barra al 75 %
  assert.equal(estadoCofre(Date.UTC(2026, 9, 14, 3, 0, 0), false).progreso, 0.75);
});

test("desde las 18:00 con cofre está listo; sin cofre cuenta para mañana con la barra llena", () => {
  assert.deepEqual(estadoCofre(A_LAS_18, true), { fase: "listo", restanteMs: 0, progreso: 0 });
  const e = estadoCofre(A_LAS_18, false);
  assert.equal(e.fase, "espera");
  assert.equal(e.progreso, 1);
  assert.equal(e.restanteMs, DIA_MS);
});

test("formatea hh:mm:ss y detecta el mismo día", () => {
  assert.equal(formatearRestante(3_725_000), "01:02:05");
  assert.equal(formatearRestante(-5), "00:00:00");
  assert.equal(mismoDia(Date.UTC(2026, 9, 13, 12), Date.UTC(2026, 9, 14, 2)), true);
  assert.equal(mismoDia(Date.UTC(2026, 9, 14, 2), Date.UTC(2026, 9, 14, 4)), false);
});
