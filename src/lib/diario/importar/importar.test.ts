import { test } from "node:test";
import assert from "node:assert/strict";
import { strToU8, zipSync } from "fflate";
import type { NodoDoc } from "../contenido.ts";
import { documentoJson, nombrarEntradas, reescribirImagenes, type DatosExport, type EntradaExport } from "../exportar.ts";
import { abrirArchivo, leerArchivos, resumirPaquete } from "./detectar.ts";
import { animoDePuntaje, animoLegado, colorDeEntero, leerCsv, leerTablasXml, leerZip, momentoDeIso, momentoDePared, normalizarRuta, resolverArchivo } from "./comun.ts";
import { htmlAMarkdown } from "./html.ts";
import { leerDailyYouJson, leerJsonPropio, leerMyBrain, leerOneShot, leerPixels, sinEnlaces } from "./json.ts";
import { animoDeMeta, fechaDeNombre, leerFrontMatter, leerMarkdown, leerYaml, reescribirCuerpo, separarTitulo, tituloDeNombre, valorYaml } from "./markdown.ts";
import { MARCADOR_ARCHIVO, MARCADOR_IMAGEN, ImportacionError, type Archivos } from "./tipos.ts";

const bytes = (s: string) => strToU8(s);
const archivos = (o: Record<string, string | Uint8Array>): Archivos => new Map(Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? bytes(v) : v]));

// ── comunes ──────────────────────────────────────────────────────────────────

test("animoDePuntaje: de 1 a 5, o al revés, y se lleva al borde", () => {
  assert.equal(animoDePuntaje(1), 1);
  assert.equal(animoDePuntaje(5), 5);
  assert.equal(animoDePuntaje(1, true), 5);
  assert.equal(animoDePuntaje(2, true), 4);
  assert.equal(animoDePuntaje(9), 5);
  assert.equal(animoDePuntaje(-3), 1);
});

test("animoLegado: de −2..2 a 1..5", () => {
  assert.equal(animoLegado(-2), 1);
  assert.equal(animoLegado(0), 3);
  assert.equal(animoLegado(2), 5);
  assert.equal(animoLegado(null), null);
});

test("momentoDeIso: sin zona es hora de pared; con zona es un instante", () => {
  assert.deepEqual(momentoDeIso("2026-07-20T09:30:00.000"), { fecha: "2026-07-20", hora: 570, instante: null });
  assert.deepEqual(momentoDeIso("2026-07-20"), { fecha: "2026-07-20", hora: null, instante: null });
  assert.deepEqual(momentoDeIso("2026-07-20T09:30:00Z"), { fecha: null, hora: null, instante: "2026-07-20T09:30:00.000Z" });
  assert.equal(momentoDeIso("2026-07-20T09:30:00-03:00")?.instante, "2026-07-20T12:30:00.000Z");
  assert.equal(momentoDeIso("2026-02-30"), null);
  assert.equal(momentoDeIso("basura"), null);
  assert.equal(momentoDeIso(5), null);
});

test("momentoDePared aplica el desfase de la zona de quien escribió", () => {
  const ms = Date.UTC(2026, 6, 20, 12, 30);
  assert.deepEqual(momentoDePared(ms, -3 * 3600_000), { fecha: "2026-07-20", hora: 9 * 60 + 30, instante: null });
  assert.deepEqual(momentoDePared(Date.UTC(2026, 6, 20, 1, 0), -3 * 3600_000), { fecha: "2026-07-19", hora: 22 * 60, instante: null });
  assert.equal(momentoDePared(Number.NaN), null);
});

test("colorDeEntero pasa el ARGB de Dart a #rrggbb", () => {
  assert.equal(colorDeEntero(0xff43a047), "#43a047");
  assert.equal(colorDeEntero(null), null);
  assert.equal(colorDeEntero(-1), null);
});

test("normalizarRuta y resolverArchivo no salen de la raíz", () => {
  assert.equal(normalizarRuta("./a//b/../c.png"), "a/c.png");
  assert.equal(normalizarRuta("../x"), null);
  const a = archivos({ "fotos/Uno.PNG": "x", "n.md": "y" });
  assert.equal(resolverArchivo(a, "", "fotos/uno.png"), "fotos/Uno.PNG");
  assert.equal(resolverArchivo(a, "fotos", "../n.md"), "n.md");
  assert.equal(resolverArchivo(a, "", "../afuera.png"), null);
  assert.equal(resolverArchivo(a, "", "https://x.com/a.png"), null);
  assert.equal(resolverArchivo(a, "", "/etc/passwd"), null);
  assert.equal(resolverArchivo(a, "fotos", "Uno%2EPNG"), "fotos/Uno.PNG");
});

test("leerCsv: comillas, comas y saltos de línea dentro de una celda", () => {
  assert.deepEqual(leerCsv('﻿a,b\r\n"x, y","di ""hola""\nchau"\r\n'), [["a", "b"], ["x, y", 'di "hola"\nchau']]);
  assert.deepEqual(leerCsv("a,b"), [["a", "b"]]);
  assert.deepEqual(leerCsv(""), []);
});

test("leerTablasXml: tablas, filas, entidades y CDATA", () => {
  const xml = `<?xml version="1.0"?><data><table name="diaro_entries"><r><uid>u1</uid><title>A &amp; B</title><text><![CDATA[Hola <b>x</b>]]></text><mood/></r></table><table name="otra"></table></data>`;
  const t = leerTablasXml(xml);
  assert.deepEqual(t.get("diaro_entries"), [{ uid: "u1", title: "A & B", text: "Hola <b>x</b>", mood: "" }]);
  assert.deepEqual(t.get("otra"), []);
});

test("leerZip quita __MACOSX, ocultos y la carpeta madre única", () => {
  const zip = zipSync({ "Mi diario/a.md": bytes("a"), "Mi diario/fotos/f.png": bytes("f"), "__MACOSX/x": bytes("x"), "Mi diario/.DS_Store": bytes("x") });
  assert.deepEqual([...leerZip(zip).keys()].sort(), ["a.md", "fotos/f.png"]);
  assert.throws(() => leerZip(bytes("no es un zip")), ImportacionError);
});

// ── HTML ─────────────────────────────────────────────────────────────────────

test("htmlAMarkdown: estilos, saltos, listas y enlaces", () => {
  assert.equal(htmlAMarkdown("Hola <b>fuerte</b> y <i>cursiva</i><br>nueva línea"), "Hola **fuerte** y *cursiva*\\\nnueva línea");
  assert.equal(htmlAMarkdown("<p>Uno</p><p>Dos &amp; tres</p>"), "Uno\n\nDos & tres");
  assert.equal(htmlAMarkdown("<ul><li>a</li><li>b</li></ul>"), "- a\n- b");
  assert.equal(htmlAMarkdown("<ol><li>a</li><li>b</li></ol>"), "1. a\n2. b");
  assert.equal(htmlAMarkdown('<a href="https://a.com">sitio</a> y <a href="javascript:x">mal</a>'), "[sitio](https://a.com) y mal");
  assert.equal(htmlAMarkdown("<h2>Título</h2><p>texto</p>"), "## Título\n\ntexto");
  assert.equal(htmlAMarkdown("<blockquote><p>cita</p></blockquote>"), "> cita");
  assert.equal(htmlAMarkdown("solo texto &lt;3"), "solo texto <3");
});

// ── YAML y front matter ──────────────────────────────────────────────────────

test("valorYaml: escalares, listas y mapas", () => {
  assert.equal(valorYaml('"Un \\"día\\""'), 'Un "día"');
  assert.equal(valorYaml("'it''s'"), "it's");
  assert.equal(valorYaml("4"), 4);
  assert.equal(valorYaml("true"), true);
  assert.equal(valorYaml("~"), null);
  assert.deepEqual(valorYaml('["a", "b"]'), ["a", "b"]);
  assert.deepEqual(valorYaml("[a, b c]"), ["a", "b c"]);
  assert.deepEqual(valorYaml('{"Agua": 3}'), { Agua: 3 });
  assert.equal(valorYaml("texto # comentario"), "texto");
});

test("leerYaml: lista con guiones y mapa de un nivel", () => {
  const y = leerYaml("title: Hola\ntags:\n  - uno\n  - dos\nweather:\n  icon: sol\n  temp: 20\nfavorite: true");
  assert.equal(y.title, "Hola");
  assert.deepEqual(y.tags, ["uno", "dos"]);
  assert.deepEqual(y.weather, { icon: "sol", temp: 20 });
  assert.equal(y.favorite, true);
});

test("leerFrontMatter y separarTitulo", () => {
  const r = leerFrontMatter('﻿---\r\ntitle: "A"\r\n---\r\n\r\n# Un título\r\n\r\nCuerpo');
  assert.equal(r.meta.title, "A");
  assert.equal(leerFrontMatter("sin front matter").cuerpo, "sin front matter");
  assert.equal(leerFrontMatter("---\nsin cierre").cuerpo, "---\nsin cierre");
  assert.deepEqual(separarTitulo("\n# Un título #\n\nCuerpo"), { titulo: "Un título", cuerpo: "Cuerpo" });
  assert.deepEqual(separarTitulo("Cuerpo\n# no"), { titulo: null, cuerpo: "Cuerpo\n# no" });
});

test("nombres de archivo: fecha y título", () => {
  assert.equal(fechaDeNombre("notas/2026-07-20_Misa.md"), "2026-07-20");
  assert.equal(fechaDeNombre("2026-02-30.md"), null);
  assert.equal(tituloDeNombre("2026-07-20_Misa de hoy.md"), "Misa de hoy");
  assert.equal(tituloDeNombre("2026-07-20_2.md"), null);
  assert.equal(tituloDeNombre("2026-07-20.md"), null);
});

test("animoDeMeta: número, nombre en español o inglés", () => {
  assert.equal(animoDeMeta(4), 4);
  assert.equal(animoDeMeta("5"), 5);
  assert.equal(animoDeMeta("Muy bien"), 5);
  assert.equal(animoDeMeta("awesome"), 5);
  assert.equal(animoDeMeta("7"), null);
  assert.equal(animoDeMeta(null), null);
});

test("reescribirCuerpo: imágenes del ZIP a marcadores; lo que no está queda como texto", () => {
  const a = archivos({ "notas/f/uno.png": "x", "notas/doc.pdf": "y", "notas/programa.exe": "z", "notas/otra.md": "m" });
  const r = reescribirCuerpo("![foto](f/uno.png) y ![otra](f/uno.png) ![falta](f/no.png) [doc](doc.pdf) [web](https://a.com) [a](#x)", a, "notas");
  assert.equal(r.cuerpo, `![foto](${MARCADOR_IMAGEN}0) y ![otra](${MARCADOR_IMAGEN}0) falta [doc](${MARCADOR_ARCHIVO}1) [web](https://a.com) [a](#x)`);
  // Lane 294: un documento admitido se sube como adjunto; un ejecutable o una nota Markdown quedan como su nombre
  assert.deepEqual(r.imagenes, ["notas/f/uno.png", "notas/doc.pdf"]);
  assert.equal(r.faltantes, 1);
  assert.equal(r.noImagenes, 0);
  const otros = reescribirCuerpo("[exe](programa.exe) [nota](otra.md) [voz](voz.m4a)", archivos({ "programa.exe": "z", "otra.md": "m", "voz.m4a": "a" }), "");
  assert.equal(otros.cuerpo, `exe nota [voz](${MARCADOR_ARCHIVO}0)`);
  assert.deepEqual(otros.imagenes, ["voz.m4a"]);
  assert.equal(otros.noImagenes, 2);
});

test("leerMarkdown: una nota con front matter, otra solo con fecha en el nombre", () => {
  const a = archivos({
    "2026-07-20.md": '---\ndate: "2026-07-20T09:30"\ntitle: "Día de misa"\nmood: 4\ncategory: "Fe › Misa"\ntags: ["Familia"]\ntrackers: {"Agua": 3}\nfavorite: true\n---\n\nTexto ![](fotos/a.png)',
    "2026-07-21_Paseo.md": "# Paseo\n\nSolo texto",
    "fotos/a.png": "x",
  });
  const p = leerMarkdown(a);
  assert.equal(p.entradas.length, 2);
  const [uno, dos] = p.entradas;
  assert.deepEqual([uno.fecha, uno.hora, uno.titulo, uno.animo, uno.categoria, uno.favorita], ["2026-07-20", 570, "Día de misa", 4, "Fe › Misa", true]);
  assert.deepEqual(uno.etiquetas, [
    { nombre: "Familia", tipo: "etiqueta", valor: null },
    { nombre: "Agua", tipo: "contador", valor: "3" },
  ]);
  assert.equal(uno.markdown, `Texto ![](${MARCADOR_IMAGEN}0)`);
  assert.deepEqual(uno.imagenes, ["fotos/a.png"]);
  assert.deepEqual([dos.fecha, dos.hora, dos.titulo, dos.markdown], ["2026-07-21", null, "Paseo", "Solo texto"]);
  assert.deepEqual(p.categorias, [{ camino: "Fe › Misa", color: null }]);
});

// ── JSON de Daily You y de otras apps ────────────────────────────────────────

test("leerDailyYouJson: versión 2 con grupos, etiquetas, contadores y fotos", () => {
  const raiz = {
    format: "daily-you",
    version: 2,
    categories: [{ name: "Personas", icon: "👪", iconType: "character", color: 0xff43a047, sortOrder: 0 }],
    tags: [
      { name: "Mamá", type: "label", category: "Personas", icon: "👩", iconType: "character", color: null },
      { name: "Agua", type: "tracker", category: null, icon: "droplet", iconType: "materialIcon", color: null },
    ],
    entries: [
      {
        text: "Hola",
        mood: 4,
        timeCreate: "2026-07-20T09:30:00.000",
        timeModified: "2026-07-20T09:30:00.000",
        tags: [{ name: "Mamá", type: "label", value: null }, { name: "Agua", type: "tracker", value: 3 }, { name: "Mal", type: "tracker", value: "x" }],
        attachments: [
          { type: "image", path: "attachments/b.jpg", rank: 0, timeCreate: "2026-07-20T09:30:00.000" },
          { type: "image", path: "attachments/a.jpg", rank: 1, timeCreate: "2026-07-20T09:30:00.000" },
          { type: "video", path: "attachments/v.mp4", rank: 2, timeCreate: "2026-07-20T09:30:00.000" },
          { type: "audio", path: "attachments/nota.m4a", rank: 4, timeCreate: "2026-07-20T09:30:00.000" },
          { type: "documento", path: "attachments/raro.bin", rank: 5, timeCreate: "2026-07-20T09:30:00.000" },
          { type: "image", path: "attachments/falta.jpg", rank: 3, timeCreate: "2026-07-20T09:30:00.000" },
        ],
      },
    ],
  };
  const a = archivos({ "attachments/a.jpg": "a", "attachments/b.jpg": "b", "attachments/v.mp4": "v", "attachments/nota.m4a": "n" });
  const p = leerDailyYouJson(raiz, a, "");
  assert.deepEqual(p.grupos, [{ nombre: "Personas", icono: "👪", tipoIcono: "emoji", color: "#43a047", seleccionUnica: false }]);
  assert.deepEqual(p.etiquetas[0], { nombre: "Mamá", tipo: "etiqueta", grupo: "Personas", icono: "👩", tipoIcono: "emoji", color: null });
  assert.deepEqual(p.etiquetas[1], { nombre: "Agua", tipo: "contador", grupo: null, icono: null, tipoIcono: "emoji", color: null });
  const e = p.entradas[0];
  assert.deepEqual([e.fecha, e.hora, e.animo, e.markdown], ["2026-07-20", 570, 4, "Hola"]);
  assert.deepEqual(e.etiquetas, [{ nombre: "Mamá", tipo: "etiqueta", valor: null }, { nombre: "Agua", tipo: "contador", valor: "3" }]);
  // Se ordenan por rango, de mayor a menor
  assert.deepEqual(e.fotos, ["attachments/a.jpg", "attachments/b.jpg"]);
  assert.equal(p.fotosFaltantes, 1);
  // Lane 294: el audio y el video pasan al final del texto (de mayor a menor rango); un tipo que no se conoce se avisa
  assert.deepEqual(e.adjuntos, ["attachments/nota.m4a", "attachments/v.mp4"]);
  assert.match(p.avisos.join(" "), /1 adjuntos de un tipo desconocido/);
});

test("leerDailyYouJson: el formato viejo (una lista) y las versiones que no se conocen", () => {
  const p = leerDailyYouJson([{ text: "Viejo", mood: 2, timeCreated: "2024-01-05T10:00:00.000", timeModified: "2024-01-05T10:00:00.000", imgPath: "a.jpg", images: [{ imgPath: "b.jpg", imgRank: 0, timeCreated: "2024-01-05T10:00:00.000" }] }], archivos({ "a.jpg": "1", "b.jpg": "2" }), "");
  assert.equal(p.entradas[0].animo, 5);
  assert.deepEqual(p.entradas[0].fotos, ["a.jpg", "b.jpg"]);
  assert.throws(() => leerDailyYouJson({ format: "daily-you", version: 9 }, archivos({}), ""), ImportacionError);
  assert.throws(() => leerDailyYouJson({ format: "otro" }, archivos({}), ""), ImportacionError);
});

test("MyBrain, OneShot y Pixels", () => {
  const my = leerMyBrain({ diary: [{ title: "T", content: "C", mood: "AWESOME", createdDate: Date.UTC(2026, 0, 2, 3, 4), updatedDate: 1 }] });
  assert.deepEqual([my.entradas[0].titulo, my.entradas[0].markdown, my.entradas[0].animo, my.entradas[0].instante], ["T", "C", 5, "2026-01-02T03:04:00.000Z"]);
  assert.throws(() => leerMyBrain({}), ImportacionError);
  const os = leerOneShot([{ created: 1767323040, textContent: "Hoy", happiness: "SAD", relativePath: "x.jpg" }]);
  assert.deepEqual([os.entradas[0].animo, os.entradas[0].markdown, os.fotosFaltantes], [2, "Hoy", 1]);
  const px = leerPixels([{ type: "Mood", date: "2026-03-04", scores: [4, 5], notes: "Bien" }, { type: "Tag", date: "2026-03-04" }, { type: "Mood", date: "2026-02-31", scores: [1] }]);
  assert.equal(px.entradas.length, 1);
  assert.deepEqual([px.entradas[0].fecha, px.entradas[0].animo, px.entradas[0].markdown], ["2026-03-04", 4, "Bien"]);
});

// ── JSON propio (ida y vuelta con la lane 291) ───────────────────────────────

const unaEntrada = (o: Partial<EntradaExport> = {}): EntradaExport => ({
  fecha: "2026-07-20",
  hora: 570,
  titulo: "Día de misa",
  texto: "Texto",
  contenido: null,
  animo: 4,
  categoria: "Fe › Misa",
  etiquetas: [{ nombre: "Familia", tipo: "etiqueta", valor: null }, { nombre: "Agua", tipo: "contador", valor: "3" }],
  clima: null,
  lugar: null,
  favorita: true,
  fijada: false,
  autor: "Gabriel",
  creadaEn: "2026-07-20T12:30:00.000Z",
  editadaEn: "2026-07-20T12:35:00.000Z",
  fotos: [],
  ...o,
});

test("el JSON que exporta la lane 291 vuelve entero", () => {
  const doc: NodoDoc = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Hola " }, { type: "diaryLink", attrs: { id: "5", label: "Mi viaje" } }] },
      { type: "image", attrs: { src: "/api/archivos/11111111-1111-1111-1111-111111111111" } },
    ],
  };
  const datos: DatosExport = {
    tipo: "personal",
    exportadaEn: "2026-07-21T00:00:00.000Z",
    catalogo: {
      escala: [],
      grupos: [{ nombre: "Personas", icono: "👪", tipoIcono: "emoji", color: "#43a047", seleccionUnica: true, orden: 0 }],
      categorias: [{ nombre: "Misa", camino: "Fe › Misa", color: "#112233" }],
      etiquetas: [{ nombre: "Familia", tipo: "etiqueta", grupo: "Personas", icono: null, tipoIcono: "emoji", color: null, orden: 0 }],
    },
    entradas: [],
  };
  const nombradas = nombrarEntradas([unaEntrada({ contenido: doc, fotos: ["/api/archivos/11111111-1111-1111-1111-111111111111", "/api/archivos/22222222-2222-2222-2222-222222222222"] })], () => "webp");
  const json = JSON.parse(JSON.stringify(documentoJson(datos, nombradas, true)));
  const a = archivos({ "diario.json": JSON.stringify(json), "fotos/foto_2026-07-20_1.webp": "1", "fotos/foto_2026-07-20_2.webp": "2" });
  const p = leerArchivos(a);
  assert.equal(p.formato, "ordo-json");
  assert.deepEqual(p.grupos, [{ nombre: "Personas", icono: "👪", tipoIcono: "emoji", color: "#43a047", seleccionUnica: true }]);
  assert.deepEqual(p.etiquetas[0].grupo, "Personas");
  assert.deepEqual(p.categorias, [{ camino: "Fe › Misa", color: "#112233" }]);
  const e = p.entradas[0];
  assert.deepEqual([e.fecha, e.hora, e.instante, e.titulo, e.animo, e.categoria, e.favorita], ["2026-07-20", 570, "2026-07-20T12:30:00.000Z", "Día de misa", 4, "Fe › Misa", true]);
  assert.deepEqual(e.etiquetas, [{ nombre: "Familia", tipo: "etiqueta", valor: null }, { nombre: "Agua", tipo: "contador", valor: "3" }]);
  // El enlace a otra entrada pasa a texto y la imagen del documento queda como marcador; la otra foto sigue siendo de la entrada
  assert.equal(JSON.stringify(e.contenido).includes("diaryLink"), false);
  assert.match(JSON.stringify(e.contenido), /\[\[Mi viaje\]\]/);
  assert.match(JSON.stringify(e.contenido), new RegExp(`"src":"${MARCADOR_IMAGEN}0"`));
  assert.deepEqual(e.imagenes, ["fotos/foto_2026-07-20_1.webp"]);
  assert.deepEqual(e.fotos, ["fotos/foto_2026-07-20_2.webp"]);
});

test("el JSON propio sin fotos deja las imágenes con su URL y rechaza otras versiones", () => {
  const datos: DatosExport = { tipo: "personal", exportadaEn: "x", catalogo: { escala: [], grupos: [], categorias: [], etiquetas: [] }, entradas: [] };
  const doc: NodoDoc = { type: "doc", content: [{ type: "image", attrs: { src: "/api/archivos/11111111-1111-1111-1111-111111111111" } }] };
  const json = JSON.parse(JSON.stringify(documentoJson(datos, nombrarEntradas([unaEntrada({ contenido: doc })]), false)));
  const p = leerJsonPropio(json, archivos({}), "");
  assert.deepEqual(p.entradas[0].imagenes, []);
  assert.match(JSON.stringify(p.entradas[0].contenido), /\/api\/archivos\/11111111/);
  assert.throws(() => leerJsonPropio({ ...json, version: 7 }, archivos({}), ""), ImportacionError);
  assert.throws(() => leerJsonPropio({ format: "x" }, archivos({}), ""), ImportacionError);
});

test("el JSON propio devuelve el clima y el lugar de cada entrada (lane 296)", () => {
  const datos: DatosExport = { tipo: "personal", exportadaEn: "x", catalogo: { escala: [], grupos: [], categorias: [], etiquetas: [] }, entradas: [] };
  const entradas = nombrarEntradas([
    unaEntrada({ clima: { codigo: "305", temp: 18, texto: "Lluvia débil" }, lugar: { nombre: "Oficina", latitud: -34.9, longitud: -56.16, icono: "building-2" } }),
    unaEntrada({ fecha: "2026-07-21" }),
  ]);
  const json = JSON.parse(JSON.stringify(documentoJson(datos, entradas, false)));
  const p = leerJsonPropio(json, archivos({}), "");
  assert.deepEqual(p.entradas[0].clima, { codigo: "305", temp: 18, texto: "Lluvia débil" });
  assert.deepEqual(p.entradas[0].lugar, { nombre: "Oficina", latitud: -34.9, longitud: -56.16 });
  assert.equal(p.entradas[1].clima, null);
  assert.equal(p.entradas[1].lugar, null);
});

test("el JSON propio ignora un clima o un lugar que no se entienden (lane 296)", () => {
  const datos: DatosExport = { tipo: "personal", exportadaEn: "x", catalogo: { escala: [], grupos: [], categorias: [], etiquetas: [] }, entradas: [] };
  const json = JSON.parse(JSON.stringify(documentoJson(datos, nombrarEntradas([unaEntrada()]), false)));
  json.entries[0].weather = { code: "sol", temp: 20 };
  json.entries[0].place = { name: "X", latitude: 200, longitude: 0 };
  const p = leerJsonPropio(json, archivos({}), "");
  assert.equal(p.entradas[0].clima, null);
  assert.equal(p.entradas[0].lugar, null);
});

test("Markdown de moodiary: weather y position del front matter (lane 296)", () => {
  const nota = '---\ndate: "2026-07-20T09:30"\nweather: ["100", "23", "Soleado"]\nposition: ["-34.9011", "-56.1645", "Casa, Pocitos"]\n---\nHola';
  const p = leerMarkdown(archivos({ "2026-07-20.md": nota, "2026-07-21.md": "---\nposition: [\"x\"]\n---\nSin lugar" }));
  assert.deepEqual(p.entradas[0].clima, { codigo: "100", temp: 23, texto: "Soleado" });
  assert.deepEqual(p.entradas[0].lugar, { nombre: "Casa, Pocitos", latitud: -34.9011, longitud: -56.1645 });
  assert.equal(p.entradas[1].clima, null);
  assert.equal(p.entradas[1].lugar, null);
});

test("reescribirImagenes cambia, deja o quita imágenes sin tocar el resto", () => {
  const doc: NodoDoc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "a" }] }, { type: "image", attrs: { src: "x" } }, { type: "image", attrs: { src: "y" } }] };
  const r = reescribirImagenes(doc, (s) => (s === "x" ? "z" : null));
  assert.deepEqual(r.content?.map((n) => n.type), ["paragraph", "image"]);
  assert.equal(r.content?.[1].attrs?.src, "z");
  assert.equal(doc.content?.length, 3);
});

test("sinEnlaces", () => {
  const r = sinEnlaces({ type: "doc", content: [{ type: "paragraph", content: [{ type: "diaryLink", attrs: { id: "1", label: "Hola" } }] }] });
  assert.deepEqual(r.content?.[0].content, [{ type: "text", text: "[[Hola]]" }]);
});

// ── Respaldos de otras apps ──────────────────────────────────────────────────

test("Daylio: grupos, etiquetas, ánimo invertido, HTML y fotos por suma", () => {
  const copia = {
    assets: [{ id: 1, type: 1, checksum: "abc123" }],
    tag_groups: [{ id: 10, name: "Actividades", order: 1 }],
    tags: [{ id: 20, name: "Correr", id_tag_group: 10, order: 1 }, { id: 21, name: "Leer", id_tag_group: null, order: 2 }],
    dayEntries: [{ datetime: Date.UTC(2026, 6, 20, 12, 30), timeZoneOffset: -3 * 3600_000, mood: 1, note_title: "Mañana", note: "Hola<br>mundo", assets: [1], tags: [20, 21] }],
  };
  const b64 = Buffer.from(JSON.stringify(copia), "utf8").toString("base64").replace(/(.{76})/g, "$1\n");
  const p = leerArchivos(archivos({ "backup.daylio": b64, "assets/photos/abc123.jpg": "x" }));
  assert.equal(p.formato, "daylio");
  assert.deepEqual(p.grupos.map((g) => g.nombre), ["Actividades"]);
  assert.deepEqual(p.etiquetas.map((t) => [t.nombre, t.grupo]), [["Correr", "Actividades"], ["Leer", null]]);
  const e = p.entradas[0];
  assert.deepEqual([e.fecha, e.hora, e.animo, e.titulo, e.markdown], ["2026-07-20", 570, 5, "Mañana", "Hola\\\nmundo"]);
  assert.deepEqual(e.fotos, ["assets/photos/abc123.jpg"]);
  assert.deepEqual(e.etiquetas.map((t) => t.nombre), ["Correr", "Leer"]);
});

test("Daybook: entries.csv con fecha, título, texto e imágenes", () => {
  const csv = 'Date,Title,Text,Images\n2026-07-20-09:30,Misa,"Hoy, fuimos",a.jpg\n2026-07-21-10:00,,Sin foto,falta.jpg\nmal,x,y,\n';
  const p = leerArchivos(archivos({ "entries.csv": csv, "a.jpg": "x" }));
  assert.equal(p.formato, "daybook");
  assert.equal(p.entradas.length, 2);
  assert.deepEqual([p.entradas[0].fecha, p.entradas[0].hora, p.entradas[0].titulo, p.entradas[0].markdown, p.entradas[0].fotos], ["2026-07-20", 570, "Misa", "Hoy, fuimos", ["a.jpg"]]);
  assert.equal(p.fotosFaltantes, 1);
  assert.match(p.avisos.join(" "), /1 entradas/);
  assert.throws(() => leerArchivos(archivos({ "entries.csv": "A,B\n1,2" })), ImportacionError);
});

test("Diaro: DiaroBackup.xml con fotos en media/photo", () => {
  const xml = `<data>
  <table name="diaro_entries"><r><uid>u1</uid><date>${Date.UTC(2026, 6, 20, 12, 30)}</date><tz_offset>-03:00</tz_offset><title>Paseo</title><text>Un día &amp; más</text><mood>2</mood></r><r><uid>u2</uid></r></table>
  <table name="diaro_attachments"><r><entry_uid>u1</entry_uid><type>photo</type><filename>p.jpg</filename><position>1</position></r></table></data>`;
  const p = leerArchivos(archivos({ "DiaroBackup.xml": xml, "media/photo/p.jpg": "x" }));
  assert.equal(p.formato, "diaro");
  assert.equal(p.entradas.length, 1);
  const e = p.entradas[0];
  assert.deepEqual([e.fecha, e.hora, e.titulo, e.markdown, e.animo, e.fotos], ["2026-07-20", 570, "Paseo", "Un día & más", 4, ["media/photo/p.jpg"]]);
});

// ── Detección ────────────────────────────────────────────────────────────────

test("abrirArchivo y leerArchivos reconocen el formato por el contenido", () => {
  const dy = JSON.stringify({ format: "daily-you", version: 2, categories: [], tags: [], entries: [{ text: "x", mood: 3, timeCreate: "2026-01-01T10:00:00.000", timeModified: "2026-01-01T10:00:00.000", tags: [], attachments: [] }] });
  assert.equal(leerArchivos(abrirArchivo("daily_you_export.json", bytes(dy))).formato, "daily-you-json");
  assert.equal(leerArchivos(abrirArchivo("x.zip", zipSync({ "daily_you_export.json": bytes(dy) }))).formato, "daily-you-json");
  assert.equal(leerArchivos(abrirArchivo("mb.json", bytes(JSON.stringify({ diary: [{ title: "a", content: "b", mood: "GOOD", createdDate: 1_700_000_000_000, updatedDate: 1 }] })))).formato, "mybrain");
  assert.equal(leerArchivos(abrirArchivo("px.json", bytes(JSON.stringify([{ type: "Mood", date: "2026-03-04", scores: [3] }])))).formato, "pixels");
  assert.equal(leerArchivos(abrirArchivo("os.json", bytes(JSON.stringify([{ created: 1767323040, textContent: "x", happiness: "HAPPY" }])))).formato, "oneshot");
  assert.equal(leerArchivos(abrirArchivo("nota.md", bytes("Hola"))).formato, "markdown");
});

test("leerArchivos explica lo que no se puede leer", () => {
  assert.throws(() => leerArchivos(abrirArchivo("a.txt", bytes("hola"))), /No se reconoce el formato/);
  assert.throws(() => leerArchivos(abrirArchivo("a.json", bytes("{"))), /JSON válido/);
  assert.throws(() => leerArchivos(abrirArchivo("a.json", bytes("{}"))), /ningún formato conocido/);
  assert.throws(() => leerArchivos(abrirArchivo("x.zip", zipSync({ "Diarium.sqlite": bytes("x") }))), /Diarium/);
  assert.throws(() => leerArchivos(abrirArchivo("a.json", bytes(JSON.stringify({ format: "daily-you", version: 2, categories: [], tags: [], entries: [] })))), /no tiene entradas/);
});

test("resumirPaquete", () => {
  const p = leerMarkdown(archivos({ "2026-07-20.md": '---\ntags: ["a", "b"]\ncategory: "X"\n---\nHola', "2026-07-25.md": "Chau" }));
  assert.deepEqual(resumirPaquete(p), { entradas: 2, desde: "2026-07-20", hasta: "2026-07-25", etiquetas: 2, categorias: 1, conFotos: 0 });
});
