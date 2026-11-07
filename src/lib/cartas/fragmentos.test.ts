import { test } from "node:test";
import assert from "node:assert/strict";
import { gradoDe, progresoSiguienteGrado, umbralGrado } from "./fragmentos.ts";

test("umbralGrado coincide con gradoDe en cada borde (req par e impar)", () => {
  for (const req of [4, 5, 7, 10]) {
    for (const g of [1, 2, 3, 4] as const) {
      const u = umbralGrado(g, req);
      assert.equal(gradoDe(u, req), g, `req=${req} grado=${g} umbral=${u}`);
      assert.equal(gradoDe(u - 1, req), g - 1, `req=${req} justo antes del grado ${g}`);
    }
  }
});

test("progresoSiguienteGrado: recién consagrada arranca en 0 % hacia el Grado II", () => {
  const p = progresoSiguienteGrado(10, 10);
  assert.deepEqual(p, { gradoActual: 1, siguienteGrado: 2, meta: 15, faltan: 5, porcentaje: 0 });
});

test("progresoSiguienteGrado: req impar usa el mismo redondeo que gradoDe", () => {
  const p = progresoSiguienteGrado(7, 5);
  assert.equal(p.gradoActual, 1);
  assert.equal(p.meta, 8);
  assert.equal(p.faltan, 1);
});

test("progresoSiguienteGrado: sin consagrar mide hasta el Grado I y en Grado IV no hay siguiente", () => {
  assert.equal(progresoSiguienteGrado(3, 10).meta, 10);
  assert.equal(progresoSiguienteGrado(3, 10).porcentaje, 30);
  const tope = progresoSiguienteGrado(30, 10);
  assert.equal(tope.siguienteGrado, null);
  assert.equal(tope.faltan, 0);
});
