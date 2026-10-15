import { test } from "node:test";
import assert from "node:assert/strict";
import { avanceDelDia, duracion, mensajeDelDia, saludoDe } from "./saludo.ts";

test("saludoDe por franja horaria", () => {
  assert.deepEqual([4, 5, 12, 13, 19, 20, 23, 0].map(saludoDe), ["Buenas noches", "Buenos días", "Buenos días", "Buenas tardes", "Buenas tardes", "Buenas noches", "Buenas noches", "Buenas noches"]);
});

test("mensajeDelDia", () => {
  assert.equal(mensajeDelDia({ total: 0, hechos: 0 }), "Hoy no hay clase. ¡Disfrutá el día!");
  assert.equal(mensajeDelDia({ total: 1, hechos: 0 }), "Hoy tenés una cosa para hacer.");
  assert.equal(mensajeDelDia({ total: 3, hechos: 0 }), "Hoy tenés 3 cosas para hacer.");
  assert.equal(mensajeDelDia({ total: 3, hechos: 1 }), "Vas bien: te faltan 2.");
  assert.equal(mensajeDelDia({ total: 3, hechos: 2 }), "Ya casi: te falta una.");
  assert.equal(mensajeDelDia({ total: 3, hechos: 3 }), "¡Terminaste todo por hoy!");
});

test("avanceDelDia y duracion", () => {
  assert.deepEqual([avanceDelDia({ total: 0, hechos: 0 }), avanceDelDia({ total: 4, hechos: 1 }), avanceDelDia({ total: 3, hechos: 3 })], [0, 25, 100]);
  assert.deepEqual([duracion(45), duracion(60), duracion(80)], ["45 min", "1 h", "1 h 20 min"]);
});
