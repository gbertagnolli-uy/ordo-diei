import { test } from "node:test";
import assert from "node:assert/strict";
import { mensajeDeNota, opcionPorTecla, primeraSinResponder, respondidas } from "./quizFlujo.ts";

test("primeraSinResponder y respondidas", () => {
  assert.equal(primeraSinResponder([10, 11, 12], {}), 0);
  assert.equal(primeraSinResponder([10, 11, 12], { 10: 0, 12: 2 }), 1);
  assert.equal(primeraSinResponder([10, 11], { 10: 0, 11: 1 }), -1);
  assert.equal(primeraSinResponder([10, 11], { 10: 0, 11: 0 }), -1);
  assert.equal(respondidas([10, 11, 12], { 10: 0, 12: 2, 99: 1 }), 2);
});

test("opcionPorTecla: 1–4 y a–d, dentro de las opciones que hay", () => {
  assert.deepEqual(["1", "2", "3", "4", "a", "B", "d"].map((t) => opcionPorTecla(t, 4)), [0, 1, 2, 3, 0, 1, 3]);
  assert.equal(opcionPorTecla("4", 3), null);
  assert.equal(opcionPorTecla("x", 4), null);
  assert.equal(opcionPorTecla("Enter", 4), null);
});

test("mensajeDeNota según el umbral", () => {
  assert.match(mensajeDeNota(100, 70), /Perfecto/);
  assert.match(mensajeDeNota(80, 70), /Aprobaste/);
  assert.match(mensajeDeNota(60, 70), /cerca/);
  assert.match(mensajeDeNota(20, 70), /Todavía no/);
});
