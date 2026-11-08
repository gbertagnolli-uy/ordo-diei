import { test } from "node:test";
import assert from "node:assert/strict";
import { ejecutarLote, formatearBusqueda, formatearCategorias, formatearEntrada, formatearLectura, formatearResumen, mensajeSinResultados, textoDeAnimo, type EntradaPlana } from "./formato.ts";
import { citasDe } from "./citas.ts";

const nombres = new Map([[1, "Muy mal"], [2, "Mal"], [3, "Normal"], [4, "Bien"], [5, "Muy bien"]]);
const e = (id: number, o: Partial<EntradaPlana> = {}): EntradaPlana => ({ id, fecha: "2026-11-02", titulo: "Playa", texto: "Fuimos a la playa\ny comimos.", animo: 4, categoriaId: 3, ...o });

test("ánimo con el nombre de la escala de la persona", () => {
  assert.equal(textoDeAnimo(4, nombres), "Bien (4)");
  assert.equal(textoDeAnimo(null, nombres), "not recorded");
  assert.equal(textoDeAnimo(2, new Map()), "? (2)");
});

test("búsqueda: encabezado, filas con id y extracto recortado", () => {
  const t = formatearBusqueda([e(7), e(8, { titulo: null, categoriaId: null, animo: null, texto: "x".repeat(300) })], 2, nombres);
  assert.equal(t.split("\n")[0], "2 matches:");
  assert.match(t, /^id=7 【2026-11-02】Playa mood=Bien \(4\) categoryId=3$/m);
  assert.match(t, /^Fuimos a la playa y comimos\.$/m);
  assert.match(t, /^id=8 【2026-11-02】Untitled mood=not recorded$/m);
  assert.match(t, /x{200}… \(excerpt; full text via getDiary\)/);
  assert.match(formatearBusqueda([e(1)], 25, nombres), /^25 matches; the first 1 follow\. Raise limit or narrow the filters for more\./);
});

test("lo que sale de la búsqueda lo entienden las citas", () => {
  const texto = formatearBusqueda([e(7), e(8)], 2, nombres);
  assert.deepEqual(citasDe([{ id: "1", nombre: "searchDiaries", args: "{}", resultado: texto, hecha: true }]), [{ id: 7, tipo: "leida" }, { id: 8, tipo: "leida" }]);
});

test("entrada completa: cabecera, etiquetas y cuerpo (recortado si es enorme)", () => {
  const t = formatearEntrada(e(7, { etiquetas: ["Familia", "Viaje"] }), nombres);
  assert.equal(t, "id=7\ndate=2026-11-02\ntitle=Playa\nmood=Bien (4)\ncategoryId=3\ntags=Familia, Viaje\nbody:\nFuimos a la playa\ny comimos.");
  assert.match(formatearEntrada(e(7, { texto: "a".repeat(4500) }), nombres), /… \(truncated, 500 more characters\)$/);
  assert.match(formatearEntrada(e(7, { texto: "  " }), nombres), /body:\n\(empty\)$/);
});

test("lectura: avisa de las que no encontró y del tope; si no hay nada, falla", () => {
  assert.equal(formatearLectura(["A", "B"], [], 2, 10), "A\n\n---\n\nB");
  assert.equal(formatearLectura(["A"], ["9"], 11, 10), "Not found (deleted, or the id is wrong — recheck with searchDiaries): 9\n(Only the first 10 were read; call again for the rest.)\n\nA");
  assert.equal(formatearLectura([], ["9"], 1, 10), "Not found (deleted, or the id is wrong — recheck with searchDiaries): 9");
  assert.equal(formatearLectura([], [], 0, 10), "Failed: none of those ids match a diary.");
});

test("resumen del diario", () => {
  const t = formatearResumen({ total: 9, desde: "2025-01-01", hasta: "2026-11-02", porCategoria: [{ id: 1, nombre: "Viajes", cantidad: 2 }, { id: 2, nombre: "Casa", cantidad: 5 }], sinCategoria: 2, porAnimo: new Map<number | null, number>([[4, 6], [null, 3]]) }, nombres);
  assert.equal(
    t,
    "Total entries=9\nspan=2025-01-01 ~ 2026-11-02\nby category:\n- Casa (id=2): 5\n- Viajes (id=1): 2\n- uncategorised: 2\nmood distribution (null means not recorded):\n- Muy mal (1)=0, Mal (2)=0, Normal (3)=0, Bien (4)=6, Muy bien (5)=0, not recorded=3",
  );
  assert.equal(formatearResumen({ total: 0, desde: null, hasta: null, porCategoria: [], sinCategoria: 0, porAnimo: new Map() }, nombres), "No diaries yet.");
  assert.match(formatearResumen({ total: 1, desde: null, hasta: null, porCategoria: [], sinCategoria: 1, porAnimo: new Map() }, nombres), /- \(all uncategorised\)\n- uncategorised: 1/);
});

test("categorías y mensaje de sin resultados", () => {
  assert.equal(formatearCategorias([]), "No categories yet.");
  assert.equal(formatearCategorias([{ id: 1, nombre: "A", padreId: null, usos: 2 }, { id: 2, nombre: "B", padreId: 1, usos: 0 }]), "id=1 name=A entries=2\nid=2 name=B parentId=1 entries=0");
  assert.equal(mensajeSinResultados({ consulta: "playa", categoria: "Viajes", desde: "2026-01-01", hasta: "2026-02-01" }), 'No diaries match keywords "playa", category "Viajes", from 2026-01-01, to 2026-02-01.');
  assert.equal(mensajeSinResultados({ consulta: "", categoria: null, desde: null, hasta: null }), "No diaries yet.");
});

test("lote: una línea por elemento y los que fallan no frenan al resto", async () => {
  const r = await ejecutarLote({ items: [{ id: 1 }, { id: 2 }, { id: 3 }] }, async (it) => {
    if (it.id === 2) return "Failed: no diary with id=2.";
    if (it.id === 3) throw new Error("se rompió");
    return `Updated id=${it.id}.`;
  });
  assert.equal(r, "Updated id=1.\nFailed: no diary with id=2.\nFailed: id=3 se rompió");
});

test("lote: si todos fallan, un solo Failed; si no hay elementos, también; con tope avisa", async () => {
  assert.equal(await ejecutarLote({ items: [{}, {}] }, async () => "Failed: vacío."), "Failed: vacío. vacío.");
  assert.equal(await ejecutarLote({ items: [] }, async () => "ok"), "Failed: no items given.");
  assert.equal(await ejecutarLote({ items: [{}, {}, {}] }, async (_i, n) => `ok ${n}`, 2), "ok 1\nok 2\n(Only the first 2 were processed; call again for the rest.)");
  assert.equal(await ejecutarLote({ ids: [4, 5] }, async (it) => `borrada ${it.id}`), "borrada 4\nborrada 5");
  assert.equal(await ejecutarLote({ items: [{}] }, async () => { throw new Error("x"); }), "Failed: item 1 x");
});
