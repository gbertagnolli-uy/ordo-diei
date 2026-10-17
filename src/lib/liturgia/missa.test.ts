import { test } from "node:test";
import assert from "node:assert/strict";
import { filtrarSeccionesMisa } from "./missa.ts";
import type { SeccionResuelta } from "./tipos.ts";

test("filtrarSeccionesMisa: modo completa devuelve todas las secciones", () => {
  const secciones: SeccionResuelta[] = [
    { clave: "ordo", tituloLa: "Informatio", tituloEs: null, propio: false, bloques: [] },
    { clave: "introitus", tituloLa: "Introitus", tituloEs: "Introito", propio: true, bloques: [] },
    { clave: "kyrie", tituloLa: "Kyrie", tituloEs: null, propio: false, bloques: [] },
    { clave: "oratio", tituloLa: "Oratio", tituloEs: "Colecta", propio: true, bloques: [] },
  ];

  const resultado = filtrarSeccionesMisa(secciones, "completa");
  assert.equal(resultado.length, 4);
  assert.deepEqual(resultado.map((s) => s.clave), ["ordo", "introitus", "kyrie", "oratio"]);
});

test("filtrarSeccionesMisa: modo propio conserva solo secciones con propio=true", () => {
  const secciones: SeccionResuelta[] = [
    { clave: "ordo", tituloLa: "Informatio", tituloEs: null, propio: false, bloques: [] },
    { clave: "introitus", tituloLa: "Introitus", tituloEs: "Introito", propio: true, bloques: [] },
    { clave: "kyrie", tituloLa: "Kyrie", tituloEs: null, propio: false, bloques: [] },
    { clave: "oratio", tituloLa: "Oratio", tituloEs: "Colecta", propio: true, bloques: [] },
    { clave: "credo", tituloLa: "Credo", tituloEs: null, bloques: [] }, // propio undefined
  ];

  const resultado = filtrarSeccionesMisa(secciones, "propio");
  assert.equal(resultado.length, 2);
  assert.deepEqual(resultado.map((s) => s.clave), ["introitus", "oratio"]);
});

test("filtrarSeccionesMisa: array vacío devuelve array vacío en ambos modos", () => {
  assert.deepEqual(filtrarSeccionesMisa([], "completa"), []);
  assert.deepEqual(filtrarSeccionesMisa([], "propio"), []);
});
