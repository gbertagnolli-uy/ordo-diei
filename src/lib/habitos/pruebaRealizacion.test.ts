import { test } from "node:test";
import assert from "node:assert/strict";
import { MIN_RESUMEN, errorResumen, requiereResumen } from "./pruebaRealizacion.ts";

const largo = "a".repeat(MIN_RESUMEN);

test("requiereResumen: solo lectura y libro", () => {
  assert.equal(requiereResumen("lectura"), true);
  assert.equal(requiereResumen("libro"), true);
  assert.equal(requiereResumen("rosario"), false);
  assert.equal(requiereResumen(null), false);
});

test("hijo marcando hecho una lectura: exige el mínimo", () => {
  assert.match(String(errorResumen({ clave: "libro", marca: "hecho", esPadre: false, nota: "corto" })), /mínimo/);
  assert.equal(errorResumen({ clave: "libro", marca: "hecho", esPadre: false, nota: largo }), null);
  assert.match(String(errorResumen({ clave: "lectura", marca: "hecho", esPadre: false, nota: `  ${"b".repeat(MIN_RESUMEN - 1)}  ` })), /mínimo/);
});

test("no se exige a padres, ni al omitir, ni en otros hábitos", () => {
  assert.equal(errorResumen({ clave: "libro", marca: "hecho", esPadre: true, nota: null }), null);
  assert.equal(errorResumen({ clave: "libro", marca: "no", esPadre: false, nota: null }), null);
  assert.equal(errorResumen({ clave: "cama", marca: "hecho", esPadre: false, nota: null }), null);
});
