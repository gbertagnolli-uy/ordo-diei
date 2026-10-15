import { test } from "node:test";
import assert from "node:assert/strict";
import { descargarArchivo, DescargaError } from "./descarga.ts";

const publico = async () => ["8.8.8.8"];
const respuesta = (cuerpo: string, tipo: string, extra: Record<string, string> = {}, status = 200) => new Response(cuerpo, { status, headers: { "content-type": tipo, ...extra } });
const leer = async (s: ReadableStream<Uint8Array>) => new TextDecoder().decode(new Uint8Array(await new Response(s).arrayBuffer()));

test("baja un PDF público y lo entrega en streaming", async () => {
  const r = await descargarArchivo("https://x.org/a.pdf", { resolver: publico, buscar: async () => respuesta("%PDF-1.4 hola", "application/pdf") });
  assert.equal(await leer(r.cuerpo), "%PDF-1.4 hola");
});

test("rechaza http, hosts internos y nombres que resuelven a IP interna", async () => {
  const nunca = async () => assert.fail("no debería consultar");
  await assert.rejects(descargarArchivo("http://x.org/a.pdf", { resolver: publico, buscar: nunca as never }), { status: 400 });
  await assert.rejects(descargarArchivo("https://localhost/a.pdf", { resolver: publico, buscar: nunca as never }), { status: 400 });
  await assert.rejects(descargarArchivo("https://x.org/a.pdf", { resolver: async () => ["10.0.0.7"], buscar: nunca as never }), { status: 400 });
  await assert.rejects(descargarArchivo("https://x.org/a.pdf", { resolver: async () => ["8.8.8.8", "127.0.0.1"], buscar: nunca as never }), { status: 400 });
  await assert.rejects(descargarArchivo("https://x.org/a.pdf", { resolver: async () => { throw new Error("nxdomain"); }, buscar: nunca as never }), { status: 502 });
});

test("sigue redirecciones pero vuelve a validar cada destino", async () => {
  let pedidos = 0;
  const buscar = async (u: string) => {
    pedidos += 1;
    return u === "https://x.org/a.pdf" ? new Response(null, { status: 302, headers: { location: "https://cdn.x.org/b.pdf" } }) : respuesta("ok", "application/pdf");
  };
  const r = await descargarArchivo("https://x.org/a.pdf", { resolver: publico, buscar });
  assert.equal(await leer(r.cuerpo), "ok");
  assert.equal(pedidos, 2);
  // una redirección a la red interna se corta
  const resolver = async (h: string) => (h === "interno.x.org" ? ["192.168.0.5"] : ["8.8.8.8"]);
  const aInterno = async () => new Response(null, { status: 302, headers: { location: "https://interno.x.org/secreto.pdf" } });
  await assert.rejects(descargarArchivo("https://x.org/a.pdf", { resolver, buscar: aInterno }), { status: 400 });
  // bucle de redirecciones
  const bucle = async () => new Response(null, { status: 302, headers: { location: "https://x.org/a.pdf" } });
  await assert.rejects(descargarArchivo("https://x.org/a.pdf", { resolver: publico, buscar: bucle }), { message: "Demasiadas redirecciones" });
});

test("tipo equivocado, tamaño excesivo, no público y no encontrado dan su mensaje", async () => {
  await assert.rejects(descargarArchivo("https://x.org/a", { resolver: publico, buscar: async () => respuesta("<html>", "text/html") }), (e: DescargaError) => e.status === 415 && /página/.test(e.message));
  await assert.rejects(descargarArchivo("https://x.org/a", { resolver: publico, buscar: async () => respuesta("x", "application/pdf", { "content-length": String(31 * 1024 * 1024) }) }), { status: 415 });
  await assert.rejects(descargarArchivo("https://x.org/a", { resolver: publico, buscar: async () => respuesta("no", "text/plain", {}, 403) }), (e: DescargaError) => /cualquiera con el enlace/.test(e.message));
  await assert.rejects(descargarArchivo("https://x.org/a", { resolver: publico, buscar: async () => respuesta("no", "text/plain", {}, 404) }), { status: 404 });
  await assert.rejects(descargarArchivo("https://x.org/a", { resolver: publico, buscar: async () => { throw new Error("red"); } }), { status: 504 });
});
