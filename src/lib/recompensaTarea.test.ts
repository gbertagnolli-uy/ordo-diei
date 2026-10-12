import test from "node:test";
import assert from "node:assert/strict";
import { puntosBase } from "./recompensaTarea.ts";

test("más dificultad da más puntos con el mismo tiempo", () => {
  const p = (["Facil", "Media", "Dificil", "Ardua"] as const).map((d) => puntosBase(d, 20 * 60));
  assert.deepEqual([...p].sort((a, b) => a - b), p);
  assert.equal(new Set(p).size, 4);
});

test("más tiempo da más puntos con la misma dificultad, con rendimientos decrecientes", () => {
  const a = puntosBase("Media", 15 * 60);
  const b = puntosBase("Media", 30 * 60);
  const c = puntosBase("Media", 60 * 60);
  assert.ok(a < b && b < c);
  assert.ok(c < 2 * b && b < 2 * a);
});

test("ejemplos del pedido: bañarse < almuerzo < oraciones < rosario", () => {
  const banarse = puntosBase("Facil", 10 * 60);
  const almuerzo = puntosBase("Media", 40 * 60);
  const oraciones = puntosBase("Dificil", 20 * 60);
  const rosario = puntosBase("Ardua", 25 * 60);
  assert.ok(banarse < almuerzo && almuerzo <= oraciones && oraciones < rosario);
});

test("mínimo, máximo y valores raros", () => {
  assert.equal(puntosBase("Facil", 0), 5);
  assert.equal(puntosBase(null, NaN), 5);
  assert.equal(puntosBase("Ardua", 24 * 3600), 150);
});
