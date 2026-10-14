import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generarIndiceSalterio,
  buscarSalterio,
  NOTA_SALTERIO_VULGATA,
} from "./salterio.ts";

test("generarIndiceSalterio: genera 150 salmos + 3 cánticos evangélicos", () => {
  const indice = generarIndiceSalterio();
  assert.equal(indice.length, 153); // 150 salmos + 3 cánticos

  const salmo1 = indice[0];
  assert.equal(salmo1.numero, "1");
  assert.equal(salmo1.tipo, "salmo");
  assert.equal(salmo1.clave, "Psalterium/1");

  const salmo150 = indice[149];
  assert.equal(salmo150.numero, "150");
  assert.equal(salmo150.tipo, "salmo");

  const benedictus = indice.find((s) => s.numero === "Benedictus");
  assert.ok(benedictus);
  assert.equal(benedictus?.tipo, "cantico");
});

test("buscarSalterio: busca por número exacto o prefijado", () => {
  const indice = generarIndiceSalterio();

  const res22 = buscarSalterio(indice, "22");
  assert.equal(res22.length, 1);
  assert.equal(res22[0].numero, "22");
  assert.equal(res22[0].incipitLa, "Dóminus regit me, et nihil mihi déerit");

  const resPrefijo = buscarSalterio(indice, "Salmo 50");
  assert.equal(resPrefijo.length, 1);
  assert.equal(resPrefijo[0].numero, "50");

  const resPs = buscarSalterio(indice, "ps 90");
  assert.equal(resPs.length, 1);
  assert.equal(resPs[0].numero, "90");
});

test("buscarSalterio: busca por texto en latín o español", () => {
  const indice = generarIndiceSalterio();

  const resMiserere = buscarSalterio(indice, "miserere");
  assert.ok(resMiserere.some((s) => s.numero === "50"));

  const resMagnificat = buscarSalterio(indice, "magnificat");
  assert.equal(resMagnificat.length, 1);
  assert.equal(resMagnificat[0].numero, "Magnificat");
});

test("NOTA_SALTERIO_VULGATA: referencia a Vulgata y DO", () => {
  assert.ok(NOTA_SALTERIO_VULGATA.includes("Vulgata"));
  assert.ok(NOTA_SALTERIO_VULGATA.includes("no Torres Amat"));
});
