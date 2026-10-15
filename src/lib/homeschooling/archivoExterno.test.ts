import { test } from "node:test";
import assert from "node:assert/strict";
import { contentTypeDe, esIpPrivada, MAX_BYTES_ARCHIVO, respuestaAceptable, urlDeDescarga } from "./archivoExterno.ts";

test("urlDeDescarga: solo PDF y ePub; Drive por su enlace de descarga; solo https", () => {
  assert.equal(urlDeDescarga({ tipo: "pdf", proveedor: "web", externoId: null, url: "https://x.org/a.pdf" }), "https://x.org/a.pdf");
  assert.equal(urlDeDescarga({ tipo: "epub", proveedor: "drive", externoId: "ABC_def-123", url: "https://drive.google.com/file/d/ABC_def-123/view" }), "https://drive.google.com/uc?export=download&id=ABC_def-123");
  assert.equal(urlDeDescarga({ tipo: "pdf", proveedor: "web", externoId: null, url: "http://x.org/a.pdf" }), null);
  assert.equal(urlDeDescarga({ tipo: "web", proveedor: "web", externoId: null, url: "https://x.org" }), null);
  assert.equal(urlDeDescarga({ tipo: "pdf", proveedor: "web", externoId: null, url: null }), null);
  assert.equal(urlDeDescarga({ tipo: "video", proveedor: "youtube", externoId: "x", url: "https://youtu.be/x" }), null);
});

test("esIpPrivada: redes internas, loopback y link-local no; las públicas sí", () => {
  for (const ip of ["127.0.0.1", "10.0.0.5", "172.16.3.1", "172.31.255.1", "192.168.1.10", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "fe80::1", "fd12::1", "::ffff:10.0.0.1", "999.1.1.1", "abc"]) assert.equal(esIpPrivada(ip), true, ip);
  for (const ip of ["8.8.8.8", "142.250.80.46", "172.15.0.1", "172.32.0.1", "2607:f8b0:4005::1", "::ffff:8.8.8.8"]) assert.equal(esIpPrivada(ip), false, ip);
});

test("respuestaAceptable: tipo y tamaño", () => {
  assert.deepEqual(respuestaAceptable("application/pdf", 1000), { ok: true });
  assert.deepEqual(respuestaAceptable("application/epub+zip; charset=binary", null), { ok: true });
  assert.equal(respuestaAceptable("text/html; charset=utf-8", 100).ok, false);
  assert.equal(respuestaAceptable("image/png", 100).ok, false);
  assert.equal(respuestaAceptable(null, 100).ok, false);
  const grande = respuestaAceptable("application/pdf", MAX_BYTES_ARCHIVO + 1);
  assert.equal(grande.ok, false);
  assert.equal(contentTypeDe({ tipo: "epub" }), "application/epub+zip");
  assert.equal(contentTypeDe({ tipo: "pdf" }), "application/pdf");
});
