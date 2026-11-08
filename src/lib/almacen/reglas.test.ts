import { test } from "node:test";
import assert from "node:assert/strict";
import { armarClave, esProposito, leerClave, puedeLeer, validarArchivo } from "./reglas.ts";

const MB = 1024 * 1024;
const UUID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";

test("esProposito acepta solo los cuatro propósitos", () => {
  for (const p of ["libro", "audiolibro", "video", "imagen"]) assert.equal(esProposito(p), true);
  assert.equal(esProposito("documento"), false);
  assert.equal(esProposito(undefined), false);
});

test("validarArchivo acepta tipo y tamaño dentro del tope", () => {
  assert.deepEqual(validarArchivo("libro", "application/epub+zip", 30 * MB), { ok: true, tipo: "application/epub+zip", extension: "epub" });
  assert.deepEqual(validarArchivo("audiolibro", "audio/mpeg", 200 * MB), { ok: true, tipo: "audio/mpeg", extension: "mp3" });
  assert.deepEqual(validarArchivo("video", "video/mp4; codecs=avc1", 10 * MB), { ok: true, tipo: "video/mp4", extension: "mp4" });
});

test("validarArchivo deduce el tipo por la extensión cuando el navegador no lo da", () => {
  assert.deepEqual(validarArchivo("audiolibro", "", 100 * MB, "Capitulo 1.M4B"), { ok: true, tipo: "audio/x-m4b", extension: "m4b" });
  assert.deepEqual(validarArchivo("libro", "application/octet-stream", MB, "libro.epub"), { ok: true, tipo: "application/epub+zip", extension: "epub" });
  assert.equal(validarArchivo("libro", "", MB, "sin-extension").ok, false);
});

test("validarArchivo rechaza propósito, tipo y tamaño inválidos", () => {
  assert.deepEqual(validarArchivo("documento", "application/pdf", MB), { ok: false, error: "Propósito desconocido" });
  assert.deepEqual(validarArchivo("libro", "audio/mpeg", MB), { ok: false, error: "Tipo de archivo no permitido para libro" });
  assert.deepEqual(validarArchivo("imagen", "image/png", 0), { ok: false, error: "Tamaño inválido" });
  assert.deepEqual(validarArchivo("imagen", "image/png", 1.5), { ok: false, error: "Tamaño inválido" });
  assert.deepEqual(validarArchivo("video", "video/webm", 301 * MB), { ok: false, error: "El archivo supera el máximo de 300 MB" });
  assert.equal(validarArchivo("libro", "application/pdf", 100 * MB).ok, true);
  assert.equal(validarArchivo("libro", "application/pdf", 100 * MB + 1).ok, false);
});

test("armarClave y leerClave van y vuelven", () => {
  const clave = armarClave("audiolibro", 3, UUID.toUpperCase(), "m4b");
  assert.equal(clave, `audiolibro/3/${UUID}.m4b`);
  assert.deepEqual(leerClave(clave), { proposito: "audiolibro", usuarioId: 3, uuid: UUID, extension: "m4b" });
});

test("armarClave lanza y leerClave devuelve null ante datos inválidos", () => {
  assert.throws(() => armarClave("libro", 0, UUID, "epub"));
  assert.throws(() => armarClave("libro", 3, "no-es-uuid", "epub"));
  assert.throws(() => armarClave("libro", 3, UUID, "e/pub"));
  assert.equal(leerClave(`libro/3/../${UUID}.epub`), null);
  assert.equal(leerClave(`otro/3/${UUID}.epub`), null);
  assert.equal(leerClave(`libro/3/${UUID}.epub/extra`), null);
  assert.equal(leerClave(`libro/03/${UUID}.epub`), null);
});

test("puedeLeer: el dueño y los padres", () => {
  assert.equal(puedeLeer({ duenoId: 3 }, { id: 3, esPadre: false }), true);
  assert.equal(puedeLeer({ duenoId: 3 }, { id: 4, esPadre: false }), false);
  assert.equal(puedeLeer({ duenoId: 3 }, { id: 1, esPadre: true }), true);
});
