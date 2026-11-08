import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_PAGE_CHARS, decidirPush, validarPedido } from "./reglas.ts";

const pagina = (id: string, extra: Record<string, unknown> = {}) => ({ id, title: "Hola", blocks: [], ...extra });

test("página nueva (baseRev null) sin fila: se guarda", () => {
  assert.deepEqual(decidirPush(null, { id: "a", data: pagina("a"), baseRev: null, purged: false }), { guardar: true });
});

test("basada en la última revisión: se guarda; en una vieja: conflicto con la copia del servidor", () => {
  const actual = { rev: 5, datos: pagina("a", { title: "Servidor" }), purgada: false };
  assert.deepEqual(decidirPush(actual, { id: "a", data: pagina("a"), baseRev: 5, purged: false }), { guardar: true });
  const r = decidirPush(actual, { id: "a", data: pagina("a"), baseRev: 4, purged: false });
  assert.equal(r.guardar, false);
  if (!r.guardar) assert.deepEqual(r.respuesta, { ok: false, rev: 5, data: actual.datos, purged: false });
});

test("página demasiado grande", () => {
  const r = decidirPush(null, { id: "a", data: pagina("a", { relleno: "x".repeat(MAX_PAGE_CHARS) }), baseRev: null, purged: false });
  assert.equal(r.guardar, false);
  if (!r.guardar) assert.equal(r.respuesta.tooBig, true);
});

test("validarPedido", () => {
  assert.throws(() => validarPedido({ id: "../x", data: {}, baseRev: null }));
  assert.throws(() => validarPedido({ id: "a", data: pagina("b"), baseRev: null }));
  assert.deepEqual(validarPedido({ id: "a", purged: true, baseRev: 3 }), { id: "a", data: null, baseRev: 3, purged: true });
});
