import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GRAFO_VACIO,
  LARGO_VISTA_PREVIA,
  OPCIONES_GRAFO,
  cantidadAristas,
  construirGrafoGeneral,
  ensamblarGrafoLocal,
  esOpcionesGrafo,
  expandirNivel,
  filtrarGrafo,
  fraccionesDeFecha,
  instanteDe,
  profundidadValida,
  rangoDePeriodo,
  restarDias,
  rotuloDeNodo,
  vistaPrevia,
  type DatosGrafo,
  type EnlaceGrafo,
  type EntradaGrafo,
  type NodoGrafo,
} from "./grafo.ts";

const entrada = (id: number, extra: Partial<EntradaGrafo> = {}): EntradaGrafo => ({ id, fecha: "2026-01-01", hora: null, titulo: `Entrada ${id}`, texto: "", categoriaId: null, ...extra });
const e = (origenId: number, destinoId: number): EnlaceGrafo => ({ origenId, destinoId });
const ids = (g: DatosGrafo): number[] => g.nodos.map((n) => n.id);
/** Los enlaces del grafo como pares de ids (para comparar sin depender de los índices). */
const pares = (g: DatosGrafo): string[] => Array.from({ length: cantidadAristas(g) }, (_, k) => `${g.nodos[g.aristas[k * 2]].id}>${g.nodos[g.aristas[k * 2 + 1]].id}`);

// ── buildLinkGraph ───────────────────────────────────────────────────────────

test("grafo general: solo entran las entradas con algún enlace, con sentido, y se descartan los colgantes", () => {
  const g = construirGrafoGeneral([entrada(2, { fecha: "2026-01-01" }), entrada(1, { fecha: "2026-02-01" }), entrada(3)], [e(1, 2), e(1, 99)]);
  assert.deepEqual(new Set(ids(g)), new Set([1, 2]));
  assert.deepEqual(pares(g), ["1>2"]);
});

test("grafo general: sin enlaces válidos queda vacío; un enlace a sí misma no cuenta", () => {
  assert.equal(construirGrafoGeneral([entrada(1), entrada(2)], []), GRAFO_VACIO);
  assert.equal(construirGrafoGeneral([entrada(1)], [e(1, 1)]), GRAFO_VACIO);
  assert.equal(construirGrafoGeneral([entrada(1)], [e(1, 7)]), GRAFO_VACIO);
});

test("grafo general: los nodos van de la más nueva a la más antigua, con el id como desempate, y los índices coinciden", () => {
  const g = construirGrafoGeneral(
    [entrada(5, { fecha: "2026-03-01" }), entrada(4, { fecha: "2026-03-01" }), entrada(3, { fecha: "2026-05-01" }), entrada(2, { fecha: "2026-03-01", hora: 600 })],
    [e(5, 4), e(3, 2)],
  );
  assert.deepEqual(ids(g), [3, 2, 4, 5]);
  g.nodos.forEach((n, i) => assert.equal(n.indice, i));
  assert.deepEqual(pares(g), ["5>4", "3>2"]);
});

test("grafo general: el título vacío queda como cadena vacía y la vista previa sale del cuerpo", () => {
  const g = construirGrafoGeneral([entrada(1, { titulo: null, texto: "  Hoy\n\nfue   un día largo y bonito de verdad  " }), entrada(2)], [e(1, 2)]);
  const n = g.nodos.find((x) => x.id === 1)!;
  assert.equal(n.titulo, "");
  assert.equal(n.vista, "Hoy fue un día largo y b");
  assert.equal(Array.from(n.vista!).length, LARGO_VISTA_PREVIA);
});

// ── vista previa y rótulo ────────────────────────────────────────────────────

test("vistaPrevia: una línea, cortada por caracteres y sin partir un emoji; vacío = null", () => {
  assert.equal(vistaPrevia(" \n\t "), null);
  assert.equal(vistaPrevia("corto"), "corto");
  const largo = "😀".repeat(30);
  assert.equal(Array.from(vistaPrevia(largo)!).length, LARGO_VISTA_PREVIA);
});

const nodo = (extra: Partial<NodoGrafo> = {}): NodoGrafo => ({ indice: 0, id: 1, titulo: "", fecha: "2026-03-07", hora: null, categoriaId: null, vista: null, ...extra });

test("rotuloDeNodo: título hasta 10 caracteres, cuerpo hasta 5 y, si no hay nada, MM-DD", () => {
  assert.equal(rotuloDeNodo(nodo({ titulo: "Mi viaje" })), "Mi viaje");
  assert.equal(rotuloDeNodo(nodo({ titulo: "Un título bastante largo" })), "Un título …");
  assert.equal(rotuloDeNodo(nodo({ titulo: "1234567890" })), "1234567890");
  assert.equal(rotuloDeNodo(nodo({ vista: "Hoy llovió mucho" })), "Hoy l…");
  assert.equal(rotuloDeNodo(nodo({ vista: "Hola" })), "Hola");
  assert.equal(rotuloDeNodo(nodo({ titulo: "   ", vista: "Cuerpo largo" })), "Cuerp…");
  assert.equal(rotuloDeNodo(nodo()), "03-07");
  assert.equal(rotuloDeNodo(nodo({ vista: "   " })), "03-07");
});

test("rotuloDeNodo: corta por caracteres visibles, no por unidades", () => {
  const familia = "👨‍👩‍👧‍👦";
  assert.equal(rotuloDeNodo(nodo({ vista: `${familia}abcde` })), `${familia}abcd…`);
});

// ── buildEgoGraph ────────────────────────────────────────────────────────────

test("profundidadValida: de 1 a 3; lo que no es un entero vale 1", () => {
  assert.equal(profundidadValida(0), 1);
  assert.equal(profundidadValida(2), 2);
  assert.equal(profundidadValida(9), 3);
  assert.equal(profundidadValida("2"), 2);
  assert.equal(profundidadValida(1.5), 1);
  assert.equal(profundidadValida("x"), 1);
  assert.equal(profundidadValida(undefined), 1);
});

test("expandirNivel: anota los enlaces, avanza a los ids nuevos en orden y respeta el presupuesto", () => {
  const visitados = new Map([[10, 0]]);
  const candidatas = new Map<string, EnlaceGrafo>();
  const sig = expandirNivel([e(10, 30), e(20, 10), e(10, 10)], visitados, candidatas, 0, 2, 300);
  assert.deepEqual(sig, [20, 30]);
  assert.deepEqual([...candidatas.keys()], ["10>30", "20>10"]);
  assert.equal(visitados.get(20), 1);
  assert.equal(visitados.get(30), 1);

  const poco = new Map([[1, 0]]);
  assert.deepEqual(expandirNivel([e(1, 5), e(1, 4), e(1, 3)], poco, new Map(), 0, 3, 3), [3, 4]);
  assert.equal(poco.size, 3);
  assert.deepEqual(expandirNivel([e(3, 8)], poco, new Map(), 1, 3, 3), []);
});

test("expandirNivel: en el último salto anota los enlaces pero no avanza", () => {
  const visitados = new Map([[1, 0], [2, 1]]);
  const candidatas = new Map<string, EnlaceGrafo>();
  assert.deepEqual(expandirNivel([e(2, 1), e(2, 9)], visitados, candidatas, 1, 1, 300), []);
  assert.equal(candidatas.size, 2);
  assert.equal(visitados.has(9), false);
});

test("grafo local: el centro va primero y entran los dos sentidos", () => {
  const visibles = new Map([entrada(1, { fecha: "2026-01-01" }), entrada(2, { fecha: "2026-03-01" }), entrada(3, { fecha: "2026-02-01" })].map((x) => [x.id, x]));
  const g = ensamblarGrafoLocal(1, new Map([[1, 0], [2, 1], [3, 1]]), [e(2, 1), e(1, 3)], visibles);
  assert.equal(g.centro, 0);
  assert.equal(g.nodos[0].id, 1);
  assert.deepEqual(ids(g), [1, 2, 3]);
  assert.deepEqual(g.nodos.map((n) => n.profundidad), [0, 1, 1]);
  assert.deepEqual(pares(g), ["2>1", "1>3"]);
});

test("grafo local: una entrada sin enlaces queda sola; si el centro no está disponible, el grafo es vacío", () => {
  const solo = ensamblarGrafoLocal(1, new Map([[1, 0]]), [], new Map([[1, entrada(1)]]));
  assert.deepEqual(ids(solo), [1]);
  assert.equal(solo.aristas.length, 0);
  assert.equal(solo.centro, 0);
  assert.equal(ensamblarGrafoLocal(1, new Map([[1, 0]]), [], new Map()), GRAFO_VACIO);
});

test("grafo local: un enlace a una entrada no disponible se descarta, y lo que solo se alcanzaba por ella se poda", () => {
  // 3 → 2 → 1, pero la 2 no está disponible
  const visibles = new Map([[1, entrada(1)], [3, entrada(3)]]);
  const g = ensamblarGrafoLocal(1, new Map([[1, 0], [2, 1], [3, 2]]), [e(2, 1), e(3, 2)], visibles);
  assert.deepEqual(ids(g), [1]);
  assert.equal(g.aristas.length, 0);
});

test("grafo local: a igual salto manda la más nueva", () => {
  const visibles = new Map([entrada(1), entrada(2, { fecha: "2026-01-01" }), entrada(3, { fecha: "2026-06-01" })].map((x) => [x.id, x]));
  const g = ensamblarGrafoLocal(1, new Map([[1, 0], [2, 1], [3, 1]]), [e(1, 2), e(1, 3)], visibles);
  assert.deepEqual(ids(g), [1, 3, 2]);
});

// ── filtros ──────────────────────────────────────────────────────────────────

const base = (): DatosGrafo =>
  construirGrafoGeneral(
    [entrada(1, { categoriaId: 7, fecha: "2026-05-01" }), entrada(2, { categoriaId: 7, fecha: "2026-04-01" }), entrada(3, { categoriaId: 8, fecha: "2025-01-01" }), entrada(4, { categoriaId: 7, fecha: "2026-05-10" })],
    [e(1, 2), e(2, 3), e(4, 1)],
  );

test("filtrarGrafo: sin filtros devuelve el mismo grafo", () => {
  const g = base();
  assert.equal(filtrarGrafo(g, {}), g);
  assert.equal(filtrarGrafo(g, { categoriaId: null, rango: null }), g);
});

test("filtrarGrafo: por categoría deja solo los enlaces entre entradas de esa categoría y rehace los índices", () => {
  const f = filtrarGrafo(base(), { categoriaId: 7 });
  assert.deepEqual(new Set(ids(f)), new Set([1, 2, 4]));
  assert.deepEqual(new Set(pares(f)), new Set(["1>2", "4>1"]));
  f.nodos.forEach((n, i) => assert.equal(n.indice, i));
  assert.ok(f.aristas.every((i) => i < f.nodos.length));
});

test("filtrarGrafo: por rango de fechas, y se pueden combinar", () => {
  const rango = { desde: "2026-04-15", hasta: "2026-12-31" };
  const f = filtrarGrafo(base(), { rango });
  assert.deepEqual(new Set(ids(f)), new Set([1, 4]));
  assert.deepEqual(pares(f), ["4>1"]);
  assert.equal(filtrarGrafo(base(), { categoriaId: 8, rango }), GRAFO_VACIO);
});

test("filtrarGrafo: si todo se filtra, el grafo vacío; una categoría que no existe también", () => {
  assert.equal(filtrarGrafo(base(), { categoriaId: 99 }), GRAFO_VACIO);
});

test("fechas: restarDias cruza meses y años; rangoDePeriodo", () => {
  assert.equal(restarDias("2026-03-01", 1), "2026-02-28");
  assert.equal(restarDias("2026-01-10", 30), "2025-12-11");
  assert.equal(restarDias("2026-11-08", 365), "2025-11-08");
  assert.equal(rangoDePeriodo("todo", "2026-11-08"), null);
  assert.deepEqual(rangoDePeriodo("30", "2026-11-08"), { desde: "2026-10-09", hasta: "2026-11-08" });
  assert.deepEqual(rangoDePeriodo("anio", "2026-11-08"), { desde: "2026-01-01", hasta: "2026-11-08" });
  assert.deepEqual(rangoDePeriodo("365", "2026-11-08"), { desde: "2025-11-08", hasta: "2026-11-08" });
});

test("fraccionesDeFecha: 0 la más antigua, 1 la más nueva; con una sola fecha todas valen 1", () => {
  const n = (fecha: string, hora: number | null = null) => nodo({ fecha, hora });
  const f = fraccionesDeFecha([n("2026-01-01"), n("2026-01-03"), n("2026-01-02")]);
  assert.deepEqual(f, [0, 1, 0.5]);
  assert.deepEqual(fraccionesDeFecha([n("2026-01-01", 0), n("2026-01-01", 0)]), [1, 1]);
  assert.deepEqual(fraccionesDeFecha([]), []);
  assert.ok(instanteDe("2026-01-01", 60) - instanteDe("2026-01-01", null) === 3_600_000);
});

test("opciones del grafo: las guardadas se validan", () => {
  assert.ok(esOpcionesGrafo(OPCIONES_GRAFO));
  assert.ok(!esOpcionesGrafo({ ...OPCIONES_GRAFO, periodo: "mes" }));
  assert.ok(!esOpcionesGrafo({ ...OPCIONES_GRAFO, etiquetas: "si" }));
  assert.ok(!esOpcionesGrafo(null));
});
