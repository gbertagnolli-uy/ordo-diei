import { test } from "node:test";
import assert from "node:assert/strict";
import { archivosDe, docDesdeTexto, imagenesDe, sanearDocumento, textoPlanoDe, tieneArchivo, tieneImagen } from "./contenido.ts";

const URL = "/api/archivos/123e4567-e89b-12d3-a456-426614174000";
const p = (text?: string) => (text ? { type: "paragraph", content: [{ type: "text", text }] } : { type: "paragraph" });

test("textoPlanoDe: un bloque de texto por línea, hardBreak y sin media", () => {
  const doc = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Título" }] },
      p("Primera"),
      { type: "paragraph", content: [{ type: "text", text: "a" }, { type: "hardBreak" }, { type: "text", text: "b" }] },
      { type: "image", attrs: { src: URL } },
      { type: "horizontalRule" },
      { type: "bulletList", content: [{ type: "listItem", content: [p("uno")] }, { type: "listItem", content: [p("dos")] }] },
      p(),
    ],
  };
  assert.equal(textoPlanoDe(doc), "Título\nPrimera\na\nb\nuno\ndos\n");
});

test("docDesdeTexto + textoPlanoDe: ida y vuelta de una entrada vieja", () => {
  const original = "Hoy fuimos a Misa\n\nDespués comimos";
  assert.equal(textoPlanoDe(docDesdeTexto(original)), original);
});

test("sanearDocumento: conserva formato válido", () => {
  const doc = {
    type: "doc",
    attrs: { v: 1 },
    content: [
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Hola", marks: [{ type: "bold" }] }] },
      { type: "taskList", content: [{ type: "taskItem", attrs: { checked: true }, content: [p("hecho")] }] },
      { type: "codeBlock", attrs: { language: "ts" }, content: [{ type: "text", text: "const a = 1" }] },
      { type: "paragraph", content: [{ type: "text", text: "sitio", marks: [{ type: "link", attrs: { href: "https://ordo.diei" } }] }] },
      { type: "image", attrs: { src: URL, name: "foto", widthPercent: 10 } },
    ],
  };
  const s = sanearDocumento(doc);
  assert.equal(s.attrs?.v, 2);
  assert.deepEqual(s.content?.[2].attrs, { language: "ts" });
  assert.deepEqual(s.content?.[4].attrs, { src: URL, name: "foto", widthPercent: 25 });
  assert.equal(tieneImagen(s), true);
  assert.deepEqual(imagenesDe(s), [URL]);
});

test("sanearDocumento: rechaza nodos, marcas, enlaces e imágenes peligrosos", () => {
  const con = (n: object) => ({ type: "doc", content: [n] });
  assert.throws(() => sanearDocumento(con({ type: "script" })));
  assert.throws(() => sanearDocumento(con({ type: "image", attrs: { src: "https://otro.sitio/a.jpg" } })));
  assert.throws(() => sanearDocumento(con({ type: "image", attrs: { src: "javascript:alert(1)" } })));
  assert.throws(() => sanearDocumento(con({ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] })));
  assert.throws(() => sanearDocumento(con({ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "onclick" }] }] })));
  assert.throws(() => sanearDocumento({ type: "paragraph" }));
  assert.throws(() => sanearDocumento("texto"));
  assert.throws(() => sanearDocumento(null));
});

test("sanearDocumento: descarta atributos desconocidos y limita tamaño y profundidad", () => {
  const s = sanearDocumento({ type: "doc", content: [{ type: "paragraph", attrs: { onclick: "x" }, content: [{ type: "text", text: "a" }] }] });
  assert.equal(s.content?.[0].attrs, undefined);
  let hondo: object = { type: "paragraph" };
  for (let i = 0; i < 30; i++) hondo = { type: "blockquote", content: [hondo] };
  assert.throws(() => sanearDocumento({ type: "doc", content: [hondo] }));
  const enorme = { type: "doc", content: [p("x".repeat(310_000))] };
  assert.throws(() => sanearDocumento(enorme));
});

test("sanearDocumento: un documento sin contenido queda con un párrafo vacío", () => {
  assert.deepEqual(sanearDocumento({ type: "doc" }).content, [{ type: "paragraph" }]);
});

test("sanearDocumento: `code` excluye a las demás marcas, como en el editor", () => {
  const s = sanearDocumento({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "bold" }, { type: "code" }] }] }] });
  assert.deepEqual(s.content?.[0].content?.[0].marks, [{ type: "code" }]);
});

// ── Lane 294: audio, video y adjuntos ───────────────────────────────────────
const URL2 = "/api/archivos/223e4567-e89b-12d3-a456-426614174000";
const URL3 = "/api/archivos/323e4567-e89b-12d3-a456-426614174000";

test("sanearDocumento: audio, video y adjunto conservan solo sus atributos", () => {
  const s = sanearDocumento({
    type: "doc",
    content: [
      { type: "audio", attrs: { src: URL, name: "Nota de voz", onclick: "x()" } },
      { type: "video", attrs: { src: URL2, name: "clip.mp4", widthPercent: 10 } },
      { type: "attachment", attrs: { src: URL3, name: "informe.pdf", mime: "application/pdf", size: 1234, extra: 1 } },
    ],
  });
  assert.deepEqual(s.content?.[0].attrs, { src: URL, name: "Nota de voz" });
  assert.deepEqual(s.content?.[1].attrs, { src: URL2, name: "clip.mp4", widthPercent: 25 });
  assert.deepEqual(s.content?.[2].attrs, { src: URL3, name: "informe.pdf", mime: "application/pdf", size: 1234 });
});

test("sanearDocumento: el adjunto descarta peso absurdo y los bloques exigen un archivo propio", () => {
  const con = (n: object) => ({ type: "doc", content: [n] });
  const s = sanearDocumento(con({ type: "attachment", attrs: { src: URL, size: 99_000_000, mime: 5 } }));
  assert.deepEqual(s.content?.[0].attrs, { src: URL, name: null, mime: null, size: null });
  for (const type of ["audio", "video", "attachment"]) {
    assert.throws(() => sanearDocumento(con({ type, attrs: { src: "https://otro.sitio/a.mp3" } })), /inválido/, type);
    assert.throws(() => sanearDocumento(con({ type, attrs: { src: `${URL}?x=1` } })), /inválido/, type);
    assert.throws(() => sanearDocumento(con({ type })), /inválido/, type);
  }
});

test("tieneArchivo / archivosDe: audio, video y adjuntos en orden, sin contar imágenes", () => {
  const doc = sanearDocumento({
    type: "doc",
    content: [
      { type: "image", attrs: { src: URL } },
      { type: "audio", attrs: { src: URL2, name: "voz" } },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "attachment", attrs: { src: URL3, name: "a.pdf", mime: "application/pdf", size: 10 } }] }] },
    ],
  });
  assert.equal(tieneArchivo(doc), true);
  assert.deepEqual(archivosDe(doc), [
    { tipo: "audio", src: URL2, name: "voz", mime: null, size: null },
    { tipo: "attachment", src: URL3, name: "a.pdf", mime: "application/pdf", size: 10 },
  ]);
  assert.deepEqual(imagenesDe(doc), [URL]);
  assert.equal(tieneArchivo(docDesdeTexto("hola")), false);
  assert.equal(textoPlanoDe(doc), "");
});
