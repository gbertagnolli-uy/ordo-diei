import { test } from "node:test";
import assert from "node:assert/strict";
import { colorDeHijo, PALETA_HIJOS } from "./coloresHijos.ts";

test("cada hijo tiene su color y es estable; da la vuelta si hay más hijos que colores", () => {
  const ids = [10, 20, 30];
  assert.deepEqual(ids.map((i) => colorDeHijo(ids, i)), [PALETA_HIJOS[0], PALETA_HIJOS[1], PALETA_HIJOS[2]]);
  assert.equal(colorDeHijo(ids, 20), colorDeHijo(ids, 20));
  const muchos = Array.from({ length: 10 }, (_, i) => i + 1);
  assert.equal(colorDeHijo(muchos, 9), PALETA_HIJOS[0]);
  assert.equal(colorDeHijo(ids, 99), PALETA_HIJOS[0]);
  assert.equal(new Set(PALETA_HIJOS).size, PALETA_HIJOS.length);
});
