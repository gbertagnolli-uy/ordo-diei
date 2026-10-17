import { test } from "node:test";
import assert from "node:assert/strict";
import { detectarMaterial } from "../material.ts";
import { extraerTitulo, hostPublico, obtenerTitulo } from "./titulos.ts";

const respuesta = (cuerpo: unknown, ok = true) => async () => ({ ok, status: ok ? 200 : 404, json: async () => cuerpo, text: async () => String(cuerpo) });

test("extraerTitulo: entidades, espacios y sufijos de Google", () => {
  assert.equal(extraerTitulo("<html><title>  La Anunciaci&oacute;n &amp; Visitaci&#243;n \n - Google Docs</title>"), "La Anunciaci&oacute;n & Visitación");
  assert.equal(extraerTitulo("<title>Guía de oraciones - Google Drive</title>"), "Guía de oraciones");
  assert.equal(extraerTitulo("<title>Sign in - Google Accounts</title>"), null);
  assert.equal(extraerTitulo("<p>sin título</p>"), null);
  assert.equal(extraerTitulo(`<title>${"x".repeat(300)}</title>`)?.length, 148);
});

test("hostPublico: solo https y nombres públicos", () => {
  for (const u of ["https://docs.google.com/a", "https://www.vatican.va/"]) assert.equal(hostPublico(u), true, u);
  for (const u of ["http://docs.google.com", "https://localhost/a", "https://192.168.0.10/a", "https://intranet/a", "https://[::1]/a", "https://impresora.local/a", "no es url"]) assert.equal(hostPublico(u), false, u);
});

test("obtenerTitulo: oEmbed de YouTube y <title> de un Doc", async () => {
  const yt = detectarMaterial("https://youtu.be/dQw4w9WgXcQ");
  assert.equal(await obtenerTitulo(yt, respuesta({ title: "  Padre Nuestro cantado " }) as never), "Padre Nuestro cantado");
  const doc = detectarMaterial("https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit");
  assert.equal(await obtenerTitulo(doc, respuesta("<title>Tarea de Historia - Google Docs</title>") as never), "Tarea de Historia");
});

test("obtenerTitulo: falla en silencio (error de red, 404, host privado, archivos)", async () => {
  const doc = detectarMaterial("https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit");
  assert.equal(await obtenerTitulo(doc, (async () => { throw new Error("red"); }) as never), null);
  assert.equal(await obtenerTitulo(doc, respuesta("", false) as never), null);
  assert.equal(await obtenerTitulo(detectarMaterial("http://x.org/a"), respuesta("<title>x</title>") as never), null);
  assert.equal(await obtenerTitulo(detectarMaterial("https://x.org/a.pdf"), respuesta("<title>x</title>") as never), null);
  assert.equal(await obtenerTitulo(detectarMaterial("solo texto"), respuesta("<title>x</title>") as never), null);
});
