import test from "node:test";
import assert from "node:assert/strict";
import { esFechaDia, esNivelConducta, etiquetaConducta, promedioConducta } from "./niveles.ts";

test("solo valen niveles enteros de 1 a 5", () => {
  assert.equal(esNivelConducta(1), true);
  assert.equal(esNivelConducta(5), true);
  assert.equal(esNivelConducta(0), false);
  assert.equal(esNivelConducta(6), false);
  assert.equal(esNivelConducta(3.5), false);
  assert.equal(esNivelConducta("3"), false);
});

test("el promedio redondea a un decimal y vacío es null", () => {
  assert.equal(promedioConducta([]), null);
  assert.equal(promedioConducta([5, 4, 4]), 4.3);
  assert.equal(promedioConducta([2]), 2);
});

test("etiquetas y fechas", () => {
  assert.equal(etiquetaConducta(5), "Excelente");
  assert.equal(etiquetaConducta(3.6), "Bien");
  assert.equal(esFechaDia("2026-10-16"), true);
  assert.equal(esFechaDia("2026-13-40"), false);
  assert.equal(esFechaDia("16/10/2026"), false);
});
