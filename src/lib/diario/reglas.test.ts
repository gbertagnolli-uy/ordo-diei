import { test } from "node:test";
import assert from "node:assert/strict";
import { puedeBorrar, puedeEditar, puedeVer, resumenMes, validarEntrada } from "./reglas.ts";

const HOY = "2026-11-07";

test("validarEntrada: normaliza y acepta lo correcto", () => {
  const e = validarEntrada({ texto: "  Hoy fuimos a Misa  ", titulo: " ", animo: 4 }, HOY);
  assert.deepEqual(e, { fecha: HOY, titulo: null, texto: "Hoy fuimos a Misa", animo: 4, fotos: [] });
});

test("validarEntrada: rechaza vacío, futuro, > 30 días, ánimo y foto inválidos", () => {
  assert.throws(() => validarEntrada({ texto: "   " }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", fecha: "2026-11-08" }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", fecha: "2026-10-07" }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", animo: 6 }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", fotos: ["https://otro.sitio/a.jpg"] }, HOY));
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
