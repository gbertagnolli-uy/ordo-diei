import { test } from "node:test";
import assert from "node:assert/strict";
import { puedeCambiarItem } from "./checklistCompartido.ts";

test("compartida: marcar se puede, desmarcar no", () => {
  assert.deepEqual(puedeCambiarItem({ compartida: true, completadoActual: false, completadoPedido: true }), { ok: true, sinCambios: false });
  const r = puedeCambiarItem({ compartida: true, completadoActual: true, completadoPedido: false });
  assert.equal(r.ok, false);
});

test("individual: se puede marcar y desmarcar", () => {
  assert.equal(puedeCambiarItem({ compartida: false, completadoActual: true, completadoPedido: false }).ok, true);
});

test("pedir el mismo estado no cambia nada", () => {
  assert.deepEqual(puedeCambiarItem({ compartida: true, completadoActual: true, completadoPedido: true }), { ok: true, sinCambios: true });
});
