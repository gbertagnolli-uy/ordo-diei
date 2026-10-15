import { test } from "node:test";
import assert from "node:assert/strict";
import { detectarMaterial, esEnlace, esImprimible, impresionesRestantes, pareceMarkdown, vistaMaterial } from "./material.ts";

const YT = "dQw4w9WgXcQ";
const DOC = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789";

test("esEnlace: un solo enlace, con o sin esquema; el texto no", () => {
  for (const t of ["https://youtu.be/x", "www.vimeo.com/1", "docs.google.com/document/d/abc/edit", " https://a.com/b  "]) assert.equal(esEnlace(t), true, t);
  for (const t of ["", "hola mundo", "https://a.com y más", "notas.txt", "# Título\nhttps://a.com", "example"]) assert.equal(esEnlace(t), false, t);
});

test("pareceMarkdown: encabezados, listas, negritas, enlaces y código", () => {
  for (const t of ["# Hola", "- uno\n- dos", "algo **fuerte**", "ver [esto](http://a.com)", "```js\nx\n```", "1. primero", "> cita"]) assert.equal(pareceMarkdown(t), true, t);
  for (const t of ["hola mundo", "Lee las páginas 3 a 5.", "2 * 3 = 6"]) assert.equal(pareceMarkdown(t), false, t);
});

test("texto pegado: texto o markdown, con título de la primera línea", () => {
  const t = detectarMaterial("Lee el capítulo 3\ny resumilo en el cuaderno");
  assert.equal(t.tipo, "texto");
  assert.equal(t.url, null);
  assert.equal(t.contenido, "Lee el capítulo 3\ny resumilo en el cuaderno");
  assert.equal(t.titulo, "Lee el capítulo 3");

  const m = detectarMaterial("# La Anunciación\n\nLeé **Lucas 1**");
  assert.equal(m.tipo, "markdown");
  assert.equal(m.titulo, "La Anunciación");

  assert.equal(detectarMaterial("x".repeat(200)).titulo.length, 78);
  assert.equal(detectarMaterial("").contenido, "");
});

test("YouTube y Vimeo se reconocen como video con miniatura", () => {
  const y = detectarMaterial(`https://www.youtube.com/watch?v=${YT}`);
  assert.deepEqual([y.tipo, y.proveedor, y.externoId], ["video", "youtube", YT]);
  assert.equal(y.miniaturaUrl, `https://img.youtube.com/vi/${YT}/mqdefault.jpg`);
  const v = detectarMaterial("vimeo.com/123456");
  assert.deepEqual([v.tipo, v.proveedor, v.externoId], ["video", "vimeo", "123456"]);
});

test("Google Docs, Slides y Hojas", () => {
  const d = detectarMaterial(`https://docs.google.com/document/d/${DOC}/edit?usp=sharing`);
  assert.deepEqual([d.tipo, d.proveedor, d.externoId], ["documento", "gdocs", DOC]);
  assert.equal(detectarMaterial(`https://docs.google.com/presentation/d/${DOC}/edit`).proveedor, "gslides");
  assert.equal(detectarMaterial(`https://docs.google.com/spreadsheets/d/${DOC}/edit#gid=0`).proveedor, "gsheets");
  // sin id válido no es un Doc reconocible: queda como página web
  assert.equal(detectarMaterial("https://docs.google.com/document/d/x/edit").tipo, "web");
});

test("archivos de Drive: /file/d/ID y open?id=", () => {
  for (const u of [`https://drive.google.com/file/d/${DOC}/view?usp=sharing`, `https://drive.google.com/open?id=${DOC}`, `https://drive.google.com/uc?id=${DOC}&export=download`]) {
    const r = detectarMaterial(u);
    assert.deepEqual([r.tipo, r.proveedor, r.externoId], ["archivo", "drive", DOC], u);
  }
  assert.equal(detectarMaterial("https://drive.google.com/drive/folders/abc").tipo, "web");
});

test("por extensión: pdf, epub, markdown, office y video directo", () => {
  assert.deepEqual([detectarMaterial("https://x.org/libros/La-vida-de-santa-Teresa.pdf").tipo, detectarMaterial("https://x.org/libros/La-vida-de-santa-Teresa.pdf").titulo], ["pdf", "La vida de santa Teresa"]);
  assert.equal(detectarMaterial("https://x.org/a.epub").tipo, "epub");
  assert.equal(detectarMaterial("https://raw.githubusercontent.com/u/r/main/LEEME.md").tipo, "markdown");
  assert.equal(detectarMaterial("https://x.org/guia.docx").tipo, "documento");
  assert.equal(detectarMaterial("https://x.org/clase.mp4").tipo, "video");
  assert.equal(detectarMaterial("https://www.vatican.va/archive/ESL0022/_INDEX.HTM").tipo, "web");
  assert.equal(detectarMaterial("https://www.vatican.va/").titulo, "vatican.va");
});

test("vistaMaterial: embed, abrir e imprimir según el tipo", () => {
  const yt = vistaMaterial({ tipo: "video", proveedor: "youtube", externoId: YT, url: `https://youtu.be/${YT}` });
  assert.equal(yt.embedUrl, `https://www.youtube-nocookie.com/embed/${YT}?rel=0`);
  assert.equal(yt.plataformaVideo, "youtube");
  assert.equal(yt.imprimirUrl, null);

  const mp4 = vistaMaterial({ tipo: "video", proveedor: "web", externoId: null, url: "https://x.org/c.mp4" });
  assert.equal(mp4.videoDirecto, true);
  assert.equal(mp4.embedUrl, "https://x.org/c.mp4");

  const doc = vistaMaterial({ tipo: "documento", proveedor: "gdocs", externoId: DOC, url: "https://docs.google.com/document/d/" + DOC });
  assert.equal(doc.embedUrl, `https://docs.google.com/document/d/${DOC}/preview`);
  assert.equal(doc.imprimirUrl, `https://docs.google.com/document/d/${DOC}/export?format=pdf`);

  const pdfDrive = vistaMaterial({ tipo: "pdf", proveedor: "drive", externoId: DOC, url: "u" });
  assert.equal(pdfDrive.embedUrl, `https://drive.google.com/file/d/${DOC}/preview`);
  assert.equal(pdfDrive.imprimirUrl, `https://drive.google.com/file/d/${DOC}/view`);
  assert.equal(vistaMaterial({ tipo: "archivo", proveedor: "drive", externoId: DOC, url: "u" }).imprimirUrl, null);

  const pdf = vistaMaterial({ tipo: "pdf", proveedor: "web", externoId: null, url: "https://x.org/a.pdf" });
  assert.deepEqual([pdf.embedUrl, pdf.imprimirUrl], ["https://x.org/a.pdf", "https://x.org/a.pdf"]);

  const web = vistaMaterial({ tipo: "web", proveedor: "web", externoId: null, url: "https://x.org" });
  assert.deepEqual([web.embedUrl, web.abrirUrl, web.imprimirUrl], [null, "https://x.org", null]);
});

test("esImprimible: el texto siempre; el resto, solo si hay forma de imprimirlo", () => {
  assert.equal(esImprimible({ tipo: "texto", proveedor: null, externoId: null, url: null }), true);
  assert.equal(esImprimible({ tipo: "markdown", proveedor: null, externoId: null, url: null }), true);
  assert.equal(esImprimible({ tipo: "video", proveedor: "youtube", externoId: YT, url: "u" }), false);
  assert.equal(esImprimible({ tipo: "documento", proveedor: "gdocs", externoId: DOC, url: "u" }), true);
  assert.equal(esImprimible({ tipo: "web", proveedor: "web", externoId: null, url: "https://x.org" }), false);
});

test("impresionesRestantes: límite + extras − usadas, nunca negativo", () => {
  assert.equal(impresionesRestantes(2, 0, 0), 2);
  assert.equal(impresionesRestantes(2, 1, 0), 1);
  assert.equal(impresionesRestantes(2, 2, 0), 0);
  assert.equal(impresionesRestantes(2, 2, 1), 1);
  assert.equal(impresionesRestantes(0, 0, 0), 0);
  assert.equal(impresionesRestantes(1, 5, 0), 0);
});
