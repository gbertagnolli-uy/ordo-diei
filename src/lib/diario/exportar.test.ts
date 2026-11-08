import { test } from "node:test";
import assert from "node:assert/strict";
import type { NodoDoc } from "./contenido.ts";
import {
  celdaCsv,
  csvDeEntradas,
  documentoJson,
  extensionDeImagen,
  markdownDeDoc,
  markdownUnido,
  nombrarEntradas,
  nombreDeAnimo,
  nombreDeArchivo,
  notaMarkdown,
  type CatalogoExport,
  type DatosExport,
  type EntradaExport,
} from "./exportar.ts";

const txt = (text: string, ...marks: string[]): NodoDoc => ({ type: "text", text, ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}) });
const p = (...c: NodoDoc[]): NodoDoc => ({ type: "paragraph", content: c });
const doc = (...c: NodoDoc[]): NodoDoc => ({ type: "doc", content: c });
const md = (d: NodoDoc) => markdownDeDoc(d, { rutaDeImagen: (s) => s });

const entrada = (o: Partial<EntradaExport> = {}): EntradaExport => ({
  fecha: "2026-07-20",
  hora: 570,
  titulo: null,
  texto: "Hola",
  contenido: null,
  animo: null,
  categoria: null,
  etiquetas: [],
  favorita: false,
  fijada: false,
  autor: "Gabriel",
  creadaEn: "2026-07-20T12:30:00.000Z",
  editadaEn: "2026-07-20T12:30:00.000Z",
  fotos: [],
  ...o,
});

const catalogo: CatalogoExport = {
  escala: [{ valor: 4, etiqueta: "Bien", icono: null, tipoIcono: "emoji", color: null }],
  categorias: [{ nombre: "Misa", camino: "Fe › Misa", color: null }],
  etiquetas: [
    { nombre: "Familia", tipo: "etiqueta", grupo: null, icono: null, tipoIcono: "emoji", color: null, orden: 0 },
    { nombre: "Agua", tipo: "contador", grupo: null, icono: null, tipoIcono: "emoji", color: null, orden: 1 },
  ],
};

test("nombrarEntradas: un nombre por día y _2, _3 cuando hay más de una", () => {
  const n = nombrarEntradas([
    entrada({ fecha: "2026-07-21", hora: 60 }),
    entrada({ fecha: "2026-07-20", hora: 700 }),
    entrada({ fecha: "2026-07-20", hora: 100 }),
    entrada({ fecha: "2026-07-20", hora: 900 }),
  ]);
  assert.deepEqual(n.map((x) => x.nombre), ["2026-07-20", "2026-07-20_2", "2026-07-20_3", "2026-07-21"]);
  assert.equal(n[0].entrada.hora, 100);
});

test("nombrarEntradas: las fotos van a fotos/foto_<nombre>_<n>", () => {
  const [a] = nombrarEntradas([entrada({ fotos: ["/api/archivos/a", "/api/archivos/b"] })]);
  assert.deepEqual(a.fotos, ["fotos/foto_2026-07-20_1", "fotos/foto_2026-07-20_2"]);
});

test("nombrarEntradas: con extensionDe las rutas la llevan", () => {
  const [a] = nombrarEntradas([entrada({ fotos: ["/api/archivos/a"] })], () => "webp");
  assert.deepEqual(a.fotos, ["fotos/foto_2026-07-20_1.webp"]);
});

test("extensionDeImagen", () => {
  assert.equal(extensionDeImagen("image/webp"), "webp");
  assert.equal(extensionDeImagen("image/jpeg; charset=x"), "jpg");
  assert.equal(extensionDeImagen("otra/cosa"), "bin");
});

test("nombreDeAnimo usa la etiqueta de la escala y cae al nombre de siempre", () => {
  assert.equal(nombreDeAnimo(catalogo.escala, 4), "Bien");
  assert.equal(nombreDeAnimo(catalogo.escala, 1), "Muy mal");
  assert.equal(nombreDeAnimo(catalogo.escala, null), null);
});

test("markdown: estilos, enlaces y escapes", () => {
  assert.equal(md(doc(p(txt("hola "), txt("fuerte", "bold"), txt(" y "), txt("cursiva", "italic")))), "hola **fuerte** y *cursiva*");
  assert.equal(md(doc(p(txt("a*b_c")))), "a\\*b\\_c");
  assert.equal(md(doc(p(txt("tachado", "strike"), txt(" "), txt("marca", "highlight"), txt(" "), txt("sub", "underline")))), "~~tachado~~ ==marca== <u>sub</u>");
  const enlace: NodoDoc = { type: "text", text: "sitio", marks: [{ type: "link", attrs: { href: "https://a.com/x y" } }] };
  assert.equal(md(doc(p(enlace))), "[sitio](https://a.com/x%20y)");
});

test("markdown: el código en línea usa una valla más larga que sus comillas", () => {
  assert.equal(md(doc(p(txt("a`b", "code")))), "``a`b``");
});

test("markdown: títulos, listas, tareas, cita y regla", () => {
  const d = doc(
    { type: "heading", attrs: { level: 2 }, content: [txt("Título")] },
    { type: "bulletList", content: [{ type: "listItem", content: [p(txt("uno"))] }, { type: "listItem", content: [p(txt("dos"))] }] },
    { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [p(txt("tres"))] }] },
    { type: "taskList", content: [{ type: "taskItem", attrs: { checked: true }, content: [p(txt("hecha"))] }, { type: "taskItem", attrs: { checked: false }, content: [p(txt("falta"))] }] },
    { type: "blockquote", content: [p(txt("cita"))] },
    { type: "horizontalRule" },
  );
  assert.equal(md(d), ["## Título", "- uno\n- dos", "3. tres", "- [x] hecha\n- [ ] falta", "> cita", "---"].join("\n\n"));
});

test("markdown: lista anidada sangra por el largo del marcador", () => {
  const d = doc({
    type: "orderedList",
    content: [{ type: "listItem", content: [p(txt("a")), { type: "bulletList", content: [{ type: "listItem", content: [p(txt("b"))] }] }] }],
  });
  assert.equal(md(d), "1. a\n   - b");
});

test("markdown: bloque de código con valla suficiente", () => {
  const d = doc({ type: "codeBlock", attrs: { language: "js" }, content: [txt("const a = '```';")] });
  assert.equal(md(d), "````js\nconst a = '```';\n````");
});

test("markdown: tabla GFM con celdas escapadas", () => {
  const celda = (t: string, tipo = "tableCell"): NodoDoc => ({ type: tipo, content: [p(txt(t))] });
  const d = doc({
    type: "table",
    content: [
      { type: "tableRow", content: [celda("A", "tableHeader"), celda("B", "tableHeader")] },
      { type: "tableRow", content: [celda("1"), celda("x|y")] },
    ],
  });
  assert.equal(md(d), "| A | B |\n| --- | --- |\n| 1 | x\\|y |");
});

test("markdown: imagen con la ruta que se le da y enlace a otra entrada", () => {
  const d = doc({ type: "image", attrs: { src: "/api/archivos/a" } }, p({ type: "diaryLink", attrs: { id: "5", label: "Mi viaje" } }));
  const r = markdownDeDoc(d, { rutaDeImagen: () => "fotos/foto_x_1.webp" });
  assert.equal(r, "![](fotos/foto_x_1.webp)\n\n[[Mi viaje]]");
});

test("notaMarkdown: front matter, título, fotos sueltas y cuerpo", () => {
  const [n] = nombrarEntradas([
    entrada({
      titulo: 'Un "día"',
      animo: 4,
      categoria: "Fe › Misa",
      etiquetas: [
        { nombre: "Familia", tipo: "etiqueta", valor: null },
        { nombre: "Agua", tipo: "contador", valor: "3" },
      ],
      favorita: true,
      fotos: ["/api/archivos/a"],
    }),
  ]);
  const r = notaMarkdown(n, catalogo.escala, { conAutor: true });
  assert.match(r, /^---\ndate: "2026-07-20T09:30"\ntitle: "Un \\"día\\""\nmood: 4\nmoodLabel: "Bien"\ncategory: "Fe › Misa"\ntags: \["Familia"\]\ntrackers: \{"Agua":3\}\nfavorite: true\nauthor: "Gabriel"\n---\n/);
  assert.match(r, /# Un "día"/);
  assert.match(r, /!\[\]\(fotos\/foto_2026-07-20_1\)/);
  assert.match(r, /Hola\n$/);
});

test("notaMarkdown: una foto que ya está dentro del documento no se repite", () => {
  const [n] = nombrarEntradas([entrada({ contenido: doc({ type: "image", attrs: { src: "/api/archivos/a" } }), fotos: ["/api/archivos/a"] })]);
  const r = notaMarkdown(n, catalogo.escala, { conAutor: false });
  assert.equal(r.match(/!\[\]/g)?.length, 1);
  assert.doesNotMatch(r, /author:/);
});

test("markdownUnido separa las entradas con una regla", () => {
  const r = markdownUnido(nombrarEntradas([entrada({ titulo: "Uno" }), entrada({ fecha: "2026-07-21", texto: "Dos" })]), catalogo.escala, false);
  assert.match(r, /^## 2026-07-20 · Uno\n\n\*09:30\*\n\nHola\n\n---\n\n## 2026-07-21\n/);
});

test("celdaCsv escapa comillas, saltos y fórmulas", () => {
  assert.equal(celdaCsv("a,b"), '"a,b"');
  assert.equal(celdaCsv('di "x"'), '"di ""x"""');
  assert.equal(celdaCsv("=SUMA(A1)"), "'=SUMA(A1)");
  assert.equal(celdaCsv(null), "");
  assert.equal(celdaCsv(4), "4");
  assert.equal(celdaCsv(-3), "-3");
});

test("csv: BOM, columnas fijas y una columna por contador", () => {
  const n = nombrarEntradas([
    entrada({
      animo: 4,
      titulo: "T",
      etiquetas: [
        { nombre: "Familia", tipo: "etiqueta", valor: null },
        { nombre: "Agua", tipo: "contador", valor: "3" },
      ],
    }),
  ]);
  const r = csvDeEntradas(n, catalogo);
  const [cab, fila] = r.replace("﻿", "").trimEnd().split("\r\n");
  assert.ok(r.startsWith("﻿"));
  assert.equal(cab, "date,modified,mood,moodLabel,title,text,category,tags,attachments,tracker:Agua");
  assert.equal(fila, "2026-07-20T09:30,2026-07-20T12:30:00.000Z,4,Bien,T,Hola,,Familia,,3");
});

test("json: formato, versión, escala y entradas con sus fotos", () => {
  const datos: DatosExport = { tipo: "personal", exportadaEn: "2026-07-21T00:00:00.000Z", catalogo, entradas: [] };
  const n = nombrarEntradas([entrada({ animo: 4, fotos: ["/api/archivos/a"], etiquetas: [{ nombre: "Agua", tipo: "contador", valor: "3" }] })]);
  const con = documentoJson(datos, n, true) as { format: string; version: number; entries: { photos: string[]; tags: unknown[]; time: string }[]; moodScale: unknown[] };
  assert.equal(con.format, "ordo-diei-diario");
  assert.equal(con.version, 1);
  assert.equal(con.moodScale.length, 1);
  assert.equal(con.entries[0].time, "09:30");
  assert.deepEqual(con.entries[0].photos, ["fotos/foto_2026-07-20_1"]);
  assert.deepEqual(con.entries[0].tags, [{ name: "Agua", type: "contador", value: "3" }]);
  const sin = documentoJson(datos, n, false) as { entries: { photos: string[] }[] };
  assert.deepEqual(sin.entries[0].photos, []);
});

test("nombreDeArchivo", () => {
  assert.equal(nombreDeArchivo("markdown", "personal", "2026-07-20", false), "ordo-diei-diario-personal-2026-07-20.md");
  assert.equal(nombreDeArchivo("csv", "familiar", "2026-07-20", false), "ordo-diei-diario-familiar-2026-07-20.csv");
  assert.equal(nombreDeArchivo("json", "personal", "2026-07-20", true), "ordo-diei-diario-personal-2026-07-20.zip");
});
