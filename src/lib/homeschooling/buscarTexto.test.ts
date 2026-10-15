import { test } from "node:test";
import assert from "node:assert/strict";
import { coincide, filtrar, normalizar } from "./buscarTexto.ts";

test("normalizar: sin acentos, minúsculas y sin bordes", () => {
  assert.equal(normalizar("  Lección ÁÉÍÓÚ ñ "), "leccion aeiou n");
});

test("coincide: todas las palabras, en cualquier campo y orden; vacío coincide con todo", () => {
  const campos = ["Fracciones: lección 3", "Leo", null];
  assert.equal(coincide(campos, "fracc leo"), true);
  assert.equal(coincide(campos, "LECCIÓN fracciones"), true);
  assert.equal(coincide(campos, "fracc ana"), false);
  assert.equal(coincide(campos, "   "), true);
  assert.equal(coincide([], "algo"), false);
  assert.equal(coincide([null, undefined], ""), true);
});

test("filtrar: deja la lista igual si no hay consulta", () => {
  const xs = [{ t: "Padre nuestro" }, { t: "Ave María" }, { t: "Credo" }];
  assert.deepEqual(filtrar(xs, "", (x) => [x.t]), xs);
  assert.deepEqual(filtrar(xs, "maria", (x) => [x.t]), [{ t: "Ave María" }]);
  assert.deepEqual(filtrar(xs, "zzz", (x) => [x.t]), []);
});
