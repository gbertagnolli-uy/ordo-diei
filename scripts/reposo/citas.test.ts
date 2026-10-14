import { test } from "node:test";
import assert from "node:assert/strict";
import { idDeReferencia, parsearReferencia, parsearSeleccion, referenciaLegible } from "./citas.ts";

test("referencias: parseo, id y forma legible con numeración de la Vulgata", () => {
  const r = parsearReferencia("Ps 22,1-2");
  assert.deepEqual(r, { libro: "Ps", capitulo: 22, desde: 1, hasta: 2 });
  assert.equal(idDeReferencia(r!), "Ps-22-1-2");
  assert.equal(referenciaLegible(r!), "Salmo 22, 1-2");
  assert.equal(referenciaLegible(parsearReferencia("Jo 14,6")!), "San Juan 14, 6");
  assert.equal(referenciaLegible(parsearReferencia("Sir 2,6")!), "Eclesiástico 2, 6");
  assert.equal(referenciaLegible(parsearReferencia("1Cor 13,13")!), "1 Corintios 13, 13");
});

test("referencias inválidas", () => {
  assert.equal(parsearReferencia("Ps 22"), null);
  assert.equal(parsearReferencia("Ps 22,5-2"), null);
});

test("selección: ignora comentarios y repetidas; una inválida avisa", () => {
  assert.equal(parsearSeleccion("# c\nPs 22,1-2\nPs 22,1-2 # otra vez\n\nJo 14,6").length, 2);
  assert.throws(() => parsearSeleccion("esto no"));
});
