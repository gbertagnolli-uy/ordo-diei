import { test } from "node:test";
import assert from "node:assert/strict";
import { docDesdeTexto, imagenesDe, sanearDocumento, textoPlanoDe, tieneImagen } from "./contenido.ts";

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
