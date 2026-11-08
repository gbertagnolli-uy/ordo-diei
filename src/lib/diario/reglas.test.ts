import { test } from "node:test";
import assert from "node:assert/strict";
import { puedeBorrar, puedeEditar, puedeVer, resumenMes, validarEntrada, validarMarcas } from "./reglas.ts";

const HOY = "2026-11-07";

test("validarEntrada: normaliza y acepta lo correcto", () => {
  const e = validarEntrada({ texto: "  Hoy fuimos a Misa  ", titulo: " ", animo: 4 }, HOY);
  assert.deepEqual(e, { fecha: HOY, hora: null, titulo: null, texto: "Hoy fuimos a Misa", contenido: null, animo: 4, fotos: [] });
});

test("validarEntrada: rechaza vacío, futuro, fecha absurda, ánimo, hora y foto inválidos", () => {
  assert.throws(() => validarEntrada({ texto: "   " }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", fecha: "2026-11-08" }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", fecha: "1999-12-31" }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", hora: 1440 }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", hora: 7.5 }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", animo: 6 }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", fotos: ["https://otro.sitio/a.jpg"] }, HOY));
});

test("validarEntrada: ya no hay tope de 30 días hacia atrás (lane 283)", () => {
  assert.equal(validarEntrada({ texto: "x", fecha: "2024-01-15" }, HOY).fecha, "2024-01-15");
  assert.equal(validarEntrada({ texto: "x", hora: 0 }, HOY).hora, 0);
  assert.equal(validarEntrada({ texto: "x", hora: "615" }, HOY).hora, 615);
});

test("validarEntrada: con contenido deriva el texto plano e ignora el texto del cliente", () => {
  const contenido = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Misa de hoy" }] }] };
  const e = validarEntrada({ contenido, texto: "otra cosa" }, HOY);
  assert.equal(e.texto, "Misa de hoy");
  assert.equal(e.contenido?.type, "doc");
});

test("validarEntrada: una entrada puede ser solo una foto", () => {
  const url = "/api/archivos/123e4567-e89b-12d3-a456-426614174000";
  assert.equal(validarEntrada({ texto: "", fotos: [url] }, HOY).texto, "");
  const contenido = { type: "doc", content: [{ type: "image", attrs: { src: url } }] };
  assert.equal(validarEntrada({ contenido }, HOY).texto, "");
  assert.throws(() => validarEntrada({ texto: "" }, HOY));
});

test("privacidad: el personal solo lo ve el autor, ni siquiera un padre", () => {
  const personal = { tipo: "personal" as const, autorId: 7 };
  assert.equal(puedeVer(personal, { id: 7, esPadre: false }), true);
  assert.equal(puedeVer(personal, { id: 1, esPadre: true }), false);
  assert.equal(puedeBorrar(personal, { id: 1, esPadre: true }), false);
});

test("familiar: lo ven todos, edita el autor, borra el autor o un padre", () => {
  const familiar = { tipo: "familiar" as const, autorId: 7 };
  assert.equal(puedeVer(familiar, { id: 9, esPadre: false }), true);
  assert.equal(puedeEditar(familiar, { id: 1, esPadre: true }), false);
  assert.equal(puedeBorrar(familiar, { id: 1, esPadre: true }), true);
  assert.equal(puedeBorrar(familiar, { id: 9, esPadre: false }), false);
});

test("resumenMes: ánimo del día = el de la última entrada con ánimo", () => {
  const r = resumenMes([
    { fecha: "2026-11-02", animo: 2, creadaEn: "2026-11-02T10:00:00Z" },
    { fecha: "2026-11-02", animo: 5, creadaEn: "2026-11-02T20:00:00Z" },
    { fecha: "2026-11-02", animo: null, creadaEn: "2026-11-02T22:00:00Z" },
    { fecha: "2026-11-03", animo: null, creadaEn: "2026-11-03T09:00:00Z" },
  ]);
  assert.deepEqual(r.dias["2026-11-02"], { animo: 5, cantidad: 3 });
  assert.deepEqual(r.dias["2026-11-03"], { animo: null, cantidad: 1 });
  assert.equal(r.totalEntradas, 4);
  assert.deepEqual(r.diasPorAnimo, [0, 0, 0, 0, 1]);
});

test("validarEntrada: etiquetas y categoría solo aparecen si vienen en el cuerpo", () => {
  const sin = validarEntrada({ texto: "hola" }, HOY);
  assert.ok(!("etiquetas" in sin) && !("categoriaId" in sin));
  const con = validarEntrada({ texto: "hola", etiquetas: [{ id: 2, valor: "4" }], categoriaId: 7 }, HOY);
  assert.deepEqual(con.etiquetas, [{ id: 2, valor: "4" }]);
  assert.equal(con.categoriaId, 7);
  assert.equal(validarEntrada({ texto: "hola", categoriaId: null }, HOY).categoriaId, null);
  assert.deepEqual(validarEntrada({ texto: "hola", etiquetas: [] }, HOY).etiquetas, []);
  assert.throws(() => validarEntrada({ texto: "hola", categoriaId: "7" }, HOY));
  assert.throws(() => validarEntrada({ texto: "hola", etiquetas: "x" }, HOY));
});

test("validarEntrada: favorita y fijada solo aparecen si vienen y tienen que ser booleanos (lane 285)", () => {
  const sin = validarEntrada({ texto: "hola" }, HOY);
  assert.ok(!("favorita" in sin) && !("fijada" in sin));
  const con = validarEntrada({ texto: "hola", favorita: true, fijada: false }, HOY);
  assert.equal(con.favorita, true);
  assert.equal(con.fijada, false);
  assert.throws(() => validarEntrada({ texto: "hola", favorita: "si" }, HOY));
  assert.throws(() => validarEntrada({ texto: "hola", fijada: 1 }, HOY));
});

test("validarMarcas: exige al menos una cuando se pide y no deja pasar otros valores", () => {
  assert.deepEqual(validarMarcas({ favorita: true }, true), { favorita: true });
  assert.deepEqual(validarMarcas({ favorita: false, fijada: true, otra: 1 }, true), { favorita: false, fijada: true });
  assert.throws(() => validarMarcas({}, true));
  assert.deepEqual(validarMarcas({}), {});
  assert.throws(() => validarMarcas({ fijada: "no" }, true));
});
