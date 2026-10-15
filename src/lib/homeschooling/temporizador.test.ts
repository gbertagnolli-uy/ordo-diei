import { test } from "node:test";
import assert from "node:assert/strict";
import { arco, faseDe, formatoReloj, segundosRestantes } from "./temporizador.ts";

test("faseDe: verde, ámbar y rojo", () => {
  assert.equal(faseDe(1), "verde");
  assert.equal(faseDe(0.51), "verde");
  assert.equal(faseDe(0.5), "ambar");
  assert.equal(faseDe(0.21), "ambar");
  assert.equal(faseDe(0.2), "rojo");
  assert.equal(faseDe(0), "rojo");
});

test("segundosRestantes nunca baja de cero", () => {
  assert.equal(segundosRestantes(600, 100), 500);
  assert.equal(segundosRestantes(600, 700), 0);
});

test("formatoReloj", () => {
  assert.equal(formatoReloj(0), "00:00");
  assert.equal(formatoReloj(75), "01:15");
  assert.equal(formatoReloj(3725), "1:02:05");
  assert.equal(formatoReloj(-5), "00:00");
});

test("arco: proporcional y acotado", () => {
  const total = 2 * Math.PI * 40;
  assert.equal(arco(1, 40).largo, total);
  assert.ok(Math.abs(arco(0.25, 40).largo - total / 4) < 1e-9);
  assert.equal(arco(-1, 40).largo, 0);
  assert.equal(arco(2, 40).largo, total);
});
