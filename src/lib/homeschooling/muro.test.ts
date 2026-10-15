import { test } from "node:test";
import assert from "node:assert/strict";
import { colorLiturgico, LOGROS, MAX_CUERPO_MURO, MAX_TITULO_MURO, validarAviso } from "./muro.ts";

test("validarAviso: título obligatorio, límites y detalle opcional", () => {
  assert.deepEqual(validarAviso("  Mañana a la plaza ", " Llevar abrigo "), { ok: true, titulo: "Mañana a la plaza", cuerpo: "Llevar abrigo" });
  assert.deepEqual(validarAviso("Hola", "   "), { ok: true, titulo: "Hola", cuerpo: null });
  assert.equal(validarAviso("", "x").ok, false);
  assert.equal(validarAviso(null, null).ok, false);
  assert.equal(validarAviso("x".repeat(MAX_TITULO_MURO + 1), "").ok, false);
  assert.equal(validarAviso("x", "y".repeat(MAX_CUERPO_MURO + 1)).ok, false);
});

test("frases de los logros y colores litúrgicos", () => {
  assert.equal(LOGROS.libro("Leo", "Vida de San Francisco").titulo, "Leo terminó de leer «Vida de San Francisco»");
  assert.match(LOGROS.oracion("Ana", "Padre nuestro").titulo, /se sabe de memoria/);
  assert.match(LOGROS.destacada("Leo", "Mapa").titulo, /destacado de Leo/);
  assert.deepEqual([colorLiturgico("morado"), colorLiturgico("rojo"), colorLiturgico("raro")], ["Morado", "Rojo", "raro"]);
});
