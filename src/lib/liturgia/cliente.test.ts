import { test } from "node:test";
import assert from "node:assert/strict";
import { fechaDeParametro, hoyISO, moverFecha, resolverVersion } from "./cliente.ts";

test("hoyISO usa la fecha local, con ceros", () => {
  assert.equal(hoyISO(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  assert.equal(hoyISO(new Date(2026, 9, 14, 0, 1)), "2026-10-14");
});

test("moverFecha cruza meses, años y bisiestos", () => {
  assert.equal(moverFecha("2026-10-31", 1), "2026-11-01");
  assert.equal(moverFecha("2026-01-01", -1), "2025-12-31");
  assert.equal(moverFecha("2028-02-28", 1), "2028-02-29");
});

test("fechaDeParametro cae en hoy si falta o es inválida", () => {
  const ahora = new Date(2026, 9, 14, 12);
  assert.equal(fechaDeParametro("2026-12-25", ahora), "2026-12-25");
  assert.equal(fechaDeParametro("2026-02-30", ahora), "2026-10-14");
  assert.equal(fechaDeParametro(null, ahora), "2026-10-14");
});

test("resolverVersion: URL > guardada > 1906", () => {
  assert.equal(resolverVersion("1888", "1570"), "1888");
  assert.equal(resolverVersion(null, "1570"), "1570");
  assert.equal(resolverVersion("1960", "1570"), "1570");
  assert.equal(resolverVersion(null, null), "1906");
  assert.equal(resolverVersion(null, "x"), "1906");
});
