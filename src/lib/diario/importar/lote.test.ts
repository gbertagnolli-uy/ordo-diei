import { test } from "node:test";
import assert from "node:assert/strict";
import type { NodoDoc } from "../contenido.ts";
import { catalogoDelPaquete, claveEtiqueta, partesDeCamino } from "./catalogo.ts";
import { bloqueDeArchivo, colocarArchivos, entradaALote, partirEnLotes } from "./lote.ts";
import { entradaBase, MARCADOR_ARCHIVO, MARCADOR_IMAGEN, paqueteVacio } from "./tipos.ts";

const parrafo = (t: string): NodoDoc => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: t }] }] });

test("partirEnLotes respeta la cantidad y el peso, y un elemento grande va solo", () => {
  const lotes = partirEnLotes([1, 1, 1, 1, 1], () => 1, 2, 100);
  assert.deepEqual(lotes.map((l) => l.length), [2, 2, 1]);
  assert.deepEqual(partirEnLotes([5, 5, 50, 5], (x) => x, 10, 12).map((l) => l.length), [2, 1, 1]);
  assert.deepEqual(partirEnLotes([], () => 1), []);
});

test("partesDeCamino: niveles, espacios y el tope", () => {
  assert.deepEqual(partesDeCamino(" Fe  ›  Misa "), ["Fe", "Misa"]);
  assert.deepEqual(partesDeCamino("A › B › C › D › E"), ["A", "B", "C - D - E"]);
  assert.deepEqual(partesDeCamino(""), []);
});

test("catalogoDelPaquete suma lo que usan las entradas y no repite", () => {
  const p = paqueteVacio("markdown");
  p.grupos.push({ nombre: "Personas", icono: null, tipoIcono: "emoji", color: null, seleccionUnica: false });
  p.etiquetas.push({ nombre: "Mamá", tipo: "etiqueta", grupo: "Personas", icono: null, tipoIcono: "emoji", color: null }, { nombre: "Cielo", tipo: "etiqueta", grupo: "Naturaleza", icono: null, tipoIcono: "emoji", color: null });
  p.entradas.push(
    entradaBase({ categoria: "Fe › Misa", etiquetas: [{ nombre: "mamá", tipo: "etiqueta", valor: null }, { nombre: "Agua", tipo: "contador", valor: "3" }] }),
    entradaBase({ categoria: "fe › misa", etiquetas: [{ nombre: "Agua", tipo: "contador", valor: "1" }, { nombre: "Agua", tipo: "etiqueta", valor: null }] }),
  );
  const c = catalogoDelPaquete(p);
  assert.deepEqual(c.grupos.map((g) => g.nombre).sort(), ["Naturaleza", "Personas"]);
  assert.deepEqual(c.etiquetas.map((t) => claveEtiqueta(t.tipo, t.nombre)).sort(), ["contador:agua", "etiqueta:agua", "etiqueta:cielo", "etiqueta:mamá"]);
  assert.deepEqual(c.categorias.map((k) => k.camino), ["Fe › Misa"]);
});

test("entradaALote: marcadores del cuerpo, conversión a documento y texto plano", () => {
  const e = entradaBase({ markdown: `Hola ![a](${MARCADOR_IMAGEN}0) ![b](${MARCADOR_IMAGEN}1)`, imagenes: ["f/a.png", "f/b.png"], titulo: "T", animo: 4 });
  let recibido = "";
  const l = entradaALote(e, new Map([["f/a.png", "/api/archivos/u1"], ["f/b.png", null]]), (md) => {
    recibido = md;
    return parrafo("convertido");
  });
  assert.equal(recibido, "Hola ![a](/api/archivos/u1) ");
  assert.equal(l.texto, "convertido");
  assert.deepEqual([l.titulo, l.animo, l.fotos], ["T", 4, []]);
});

test("entradaALote: un documento propio cambia sus marcadores o quita la imagen que no se pudo subir", () => {
  const contenido: NodoDoc = { type: "doc", content: [{ type: "image", attrs: { src: `${MARCADOR_IMAGEN}0` } }, { type: "image", attrs: { src: `${MARCADOR_IMAGEN}1` } }, { type: "image", attrs: { src: "/api/archivos/otra" } }] };
  const l = entradaALote(entradaBase({ contenido, imagenes: ["a.png", "b.png"] }), new Map([["a.png", "/api/archivos/u1"]]), () => null);
  assert.deepEqual(l.contenido?.content?.map((n) => n.attrs?.src), ["/api/archivos/u1", "/api/archivos/otra"]);
});

test("entradaALote: hasta 4 fotos de la entrada y las demás al final del documento", () => {
  const rutas = ["1", "2", "3", "4", "5", "6"];
  const urls = new Map(rutas.map((r) => [r, `/api/archivos/${r}`] as [string, string | null]));
  const l = entradaALote(entradaBase({ markdown: "Texto", fotos: rutas }), urls, () => parrafo("Texto"));
  assert.equal(l.fotos.length, 4);
  assert.deepEqual(l.contenido?.content?.slice(1).map((n) => n.attrs?.src), ["/api/archivos/5", "/api/archivos/6"]);
  // Sin texto: queda solo con las fotos
  const sola = entradaALote(entradaBase({ fotos: ["1"] }), urls, () => null);
  assert.equal(sola.contenido, null);
  assert.deepEqual(sola.fotos, ["/api/archivos/1"]);
  assert.equal(sola.texto, "");
});

// ── Lane 294: audios, videos y documentos ───────────────────────────────────
const enlace = (texto: string, n: number): NodoDoc => ({ type: "text", text: texto, marks: [{ type: "link", attrs: { href: `${MARCADOR_ARCHIVO}${n}` } }] });
const resolver = (n: number) => ({ url: n === 2 ? null : `/api/archivos/u${n}`, ruta: ["voz.m4a", "informe.pdf", "falta.pdf", "clip.mp4"][n], bytes: n === 1 ? 1234 : null });

test("bloqueDeArchivo: el tipo sale de la extensión del archivo de origen", () => {
  assert.deepEqual(bloqueDeArchivo("/api/archivos/a", "x/voz.m4a", "Nota.m4a", null), { type: "audio", attrs: { src: "/api/archivos/a", name: "Nota" } });
  assert.deepEqual(bloqueDeArchivo("/api/archivos/a", "clip.mp4", null, null), { type: "video", attrs: { src: "/api/archivos/a", name: "clip.mp4" } });
  assert.deepEqual(bloqueDeArchivo("/api/archivos/a", "a/Informe.pdf", "Informe", 99), { type: "attachment", attrs: { src: "/api/archivos/a", name: "Informe", mime: "application/pdf", size: 99 } });
});

test("colocarArchivos: un párrafo que es solo el enlace pasa a ser el bloque; en medio del texto queda el rótulo; sin subir, solo el rótulo", () => {
  const doc: NodoDoc = {
    type: "doc",
    content: [
      { type: "paragraph", content: [enlace("Voz", 0)] },
      { type: "paragraph", content: [{ type: "text", text: "Mirá " }, enlace("el informe", 1), { type: "text", text: " ahora" }] },
      { type: "paragraph", content: [enlace("Falta", 2)] },
      { type: "blockquote", content: [{ type: "paragraph", content: [enlace("Clip", 3)] }] },
      { type: "paragraph", content: [{ type: "text", text: "web", marks: [{ type: "link", attrs: { href: "https://a.com" } }] }] },
    ],
  };
  const r = colocarArchivos(doc, resolver);
  assert.deepEqual(r.content?.[0], { type: "audio", attrs: { src: "/api/archivos/u0", name: "Voz" } });
  assert.deepEqual(r.content?.[1].content, [{ type: "text", text: "Mirá " }, { type: "text", text: "el informe" }, { type: "text", text: " ahora" }]);
  assert.deepEqual(r.content?.[2], { type: "paragraph", content: [{ type: "text", text: "Falta" }] });
  assert.deepEqual(r.content?.[3].content?.[0], { type: "video", attrs: { src: "/api/archivos/u3", name: "Clip" } });
  // un enlace común no se toca
  assert.equal(r.content?.[4].content?.[0].marks?.[0].attrs?.href, "https://a.com");
});

test("entradaALote: un documento del Markdown se vuelve bloque con su peso", () => {
  const e = entradaBase({ markdown: `Hola\n\n[Informe](${MARCADOR_ARCHIVO}0)`, imagenes: ["notas/informe.pdf"] });
  const l = entradaALote(
    e,
    new Map([["notas/informe.pdf", "/api/archivos/p1"]]),
    () => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hola" }] }, { type: "paragraph", content: [enlace("Informe", 0)] }] }),
    new Map([["notas/informe.pdf", 2048]]),
  );
  assert.deepEqual(l.contenido?.content?.[1], { type: "attachment", attrs: { src: "/api/archivos/p1", name: "Informe", mime: "application/pdf", size: 2048 } });
  assert.equal(l.texto, "Hola");
});

test("entradaALote: los audios y videos de Daily You van al final del documento", () => {
  const urls = new Map<string, string | null>([["a/nota.m4a", "/api/archivos/n1"], ["a/v.mp4", "/api/archivos/v1"], ["a/perdido.mp4", null]]);
  const l = entradaALote(entradaBase({ markdown: "Texto", adjuntos: ["a/nota.m4a", "a/v.mp4", "a/perdido.mp4"] }), urls, () => parrafo("Texto"));
  assert.deepEqual(l.contenido?.content?.slice(1).map((n) => n.type), ["audio", "video"]);
  // una entrada que es solo un audio no queda sin contenido
  const sola = entradaALote(entradaBase({ adjuntos: ["a/nota.m4a"] }), urls, () => null);
  assert.equal(sola.contenido?.content?.[0].type, "audio");
});

test("un documento propio con archivos: los marcadores se cambian y el que no se subió se quita", () => {
  const contenido: NodoDoc = { type: "doc", content: [{ type: "audio", attrs: { src: `${MARCADOR_IMAGEN}0`, name: "Voz" } }, { type: "attachment", attrs: { src: `${MARCADOR_IMAGEN}1`, name: "x.pdf" } }] };
  const l = entradaALote(entradaBase({ contenido, imagenes: ["adjuntos/v.weba", "adjuntos/x.pdf"] }), new Map([["adjuntos/v.weba", "/api/archivos/v1"]]), () => null);
  assert.deepEqual(l.contenido?.content?.map((n) => n.attrs?.src), ["/api/archivos/v1"]);
});
