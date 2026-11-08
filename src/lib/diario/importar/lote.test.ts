import { test } from "node:test";
import assert from "node:assert/strict";
import type { NodoDoc } from "../contenido.ts";
import { catalogoDelPaquete, claveEtiqueta, partesDeCamino } from "./catalogo.ts";
import { entradaALote, partirEnLotes } from "./lote.ts";
import { entradaBase, MARCADOR_IMAGEN, paqueteVacio } from "./tipos.ts";

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
