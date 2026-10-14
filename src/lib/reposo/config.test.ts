import { test } from "node:test";
import assert from "node:assert/strict";
import { cambiosConfigSchema, normalizarCambios } from "./config.ts";

test("acepta cambios parciales válidos", () => {
  assert.deepEqual(cambiosConfigSchema.parse({ segundosLogin: 20 }), { segundosLogin: 20 });
  assert.equal(cambiosConfigSchema.parse({ tamPool: 150, mostrarRefCatecismo: false }).mostrarRefCatecismo, false);
});

test("rechaza segundos fuera de 10–300, pool fuera de 20–500 y campos desconocidos", () => {
  assert.equal(cambiosConfigSchema.safeParse({ segundosSesion: 9 }).success, false);
  assert.equal(cambiosConfigSchema.safeParse({ segundosSesion: 301 }).success, false);
  assert.equal(cambiosConfigSchema.safeParse({ segundosLogin: 12.5 }).success, false);
  assert.equal(cambiosConfigSchema.safeParse({ tamPool: 19 }).success, false);
  assert.equal(cambiosConfigSchema.safeParse({ tamPool: 501 }).success, false);
  assert.equal(cambiosConfigSchema.safeParse({ unsplashTema: "otro" }).success, false);
  assert.equal(cambiosConfigSchema.safeParse({ ultimaSincronia: "2026-01-01" }).success, false);
});

test("la consulta vacía vuelve a null", () => {
  assert.equal(normalizarCambios({ unsplashConsulta: "   " }).unsplashConsulta, null);
  assert.equal(normalizarCambios({ unsplashConsulta: "bosque" }).unsplashConsulta, "bosque");
  assert.equal(normalizarCambios({}).unsplashConsulta, undefined);
});
