import { test } from "node:test";
import assert from "node:assert/strict";
import { aplanarLinea, compararEnElDia, construirLinea, escribirCursor, esOrdenLinea, leerCategoria, leerCursor, SIN_CATEGORIA, type ItemLinea } from "./linea.ts";

const item = (fecha: string, id = "x", hora = 540): ItemLinea<string> => ({ entrada: id, sello: { fecha, hora } });

// moodiary timeline_group_test.dart
test("sin entradas no hay meses", () => {
  assert.deepEqual(construirLinea([]), []);
});

test("se parte por mes y se respeta el orden recibido", () => {
  const meses = construirLinea([item("2026-07-20", "a"), item("2026-07-02", "b"), item("2026-06-30", "c")]);
  assert.equal(meses.length, 2);
  assert.equal(meses[0].mes, "2026-07");
  assert.deepEqual(meses[0].nodos.map((n) => n.item.entrada), ["a", "b"]);
  assert.equal(meses[1].mes, "2026-06");
  assert.deepEqual(meses[1].nodos.map((n) => n.item.entrada), ["c"]);
});

test("inicioDeDia solo en la primera entrada de cada día", () => {
  const meses = construirLinea([item("2026-07-20", "a", 1260), item("2026-07-20", "b", 540), item("2026-07-19", "c")]);
  assert.deepEqual(meses[0].nodos.map((n) => n.inicioDeDia), [true, false, true]);
});

test("corteAntes solo cuando se salta un día entero", () => {
  const meses = construirLinea([item("2026-07-20"), item("2026-07-19"), item("2026-07-16"), item("2026-07-16")]);
  assert.deepEqual(meses[0].nodos.map((n) => n.corteAntes), [false, false, true, false]);
});

test("corteAntes funciona igual en orden ascendente", () => {
  const meses = construirLinea([item("2026-07-16"), item("2026-07-17"), item("2026-07-20")]);
  assert.deepEqual(meses[0].nodos.map((n) => n.corteAntes), [false, false, true]);
});

test("el cambio de mes no reinicia la detección de saltos", () => {
  const meses = construirLinea([item("2026-07-01", "a"), item("2026-06-29", "b")]);
  assert.equal(meses[1].nodos[0].corteAntes, true);
  // días contiguos a través del fin de mes: sin corte
  assert.equal(construirLinea([item("2026-07-01"), item("2026-06-30")])[1].nodos[0].corteAntes, false);
});

test("un salto de dos días que cruza el cambio de hora sigue siendo un corte (fechas en UTC)", () => {
  assert.equal(construirLinea([item("2026-03-09"), item("2026-03-07")])[0].nodos[1].corteAntes, true);
  assert.equal(construirLinea([item("2026-03-09"), item("2026-03-08")])[0].nodos[1].corteAntes, false);
});

test("aplanarLinea junta los nodos de todos los meses", () => {
  const meses = construirLinea([item("2026-07-20", "a"), item("2026-06-30", "b")]);
  assert.deepEqual(aplanarLinea(meses).map((n) => n.item.entrada), ["a", "b"]);
});

test("esOrdenLinea", () => {
  assert.equal(esOrdenLinea("fecha-desc"), true);
  assert.equal(esOrdenLinea("edicion"), true);
  assert.equal(esOrdenLinea("otro"), false);
});

test("cursor de fecha: se lee y se escribe igual", () => {
  const c = leerCursor("fecha-desc", "2026-07-20");
  assert.deepEqual(c, { tipo: "fecha", fecha: "2026-07-20" });
  assert.equal(escribirCursor(c!), "2026-07-20");
  assert.equal(leerCursor("fecha-asc", null), null);
  assert.throws(() => leerCursor("fecha-desc", "2026-13-40"), /Cursor inválido/);
  assert.throws(() => leerCursor("fecha-desc", "ayer"), /Cursor inválido/);
});

test("cursor de edición: fecha y hora más id", () => {
  const c = leerCursor("edicion", "2026-07-20T12:30:00.000Z_42");
  assert.deepEqual(c, { tipo: "edicion", editadaEn: "2026-07-20T12:30:00.000Z", id: 42 });
  assert.equal(escribirCursor(c!), "2026-07-20T12:30:00.000Z_42");
  assert.throws(() => leerCursor("edicion", "2026-07-20"), /Cursor inválido/);
  assert.throws(() => leerCursor("edicion", "2026-07-20T12:30:00.000Z_x"), /Cursor inválido/);
});

test("compararEnElDia: por hora, luego creación, luego id", () => {
  const a = { hora: 600, creadaEn: "2026-07-20T10:00:00.000Z", id: 1 };
  const b = { hora: 900, creadaEn: "2026-07-20T09:00:00.000Z", id: 2 };
  const c = { hora: 900, creadaEn: "2026-07-20T09:00:00.000Z", id: 3 };
  assert.deepEqual([a, b, c].sort((x, y) => compararEnElDia(x, y, true)).map((e) => e.id), [3, 2, 1]);
  assert.deepEqual([a, b, c].sort((x, y) => compararEnElDia(x, y, false)).map((e) => e.id), [1, 2, 3]);
});

test("leerCategoria: nada, ninguna o un id", () => {
  assert.equal(leerCategoria(null), null);
  assert.equal(leerCategoria(""), null);
  assert.equal(leerCategoria("ninguna"), SIN_CATEGORIA);
  assert.equal(leerCategoria("7"), 7);
  assert.throws(() => leerCategoria("abc"), /Categoría inválida/);
  assert.throws(() => leerCategoria("-3"), /Categoría inválida/);
});
