import { test } from "node:test";
import assert from "node:assert/strict";
import { filtrarPorFechas, tituloDeRango } from "./portafolioImpreso.ts";

const e = (id: number, created_at: string, status = "aprobada") => ({ id, created_at, status });

test("filtrarPorFechas: aprobadas, dentro del rango, de la más vieja a la más nueva", () => {
  const items = [e(3, "2026-05-10T12:00:00Z"), e(1, "2026-03-01T00:00:00Z"), e(2, "2026-03-01T09:00:00Z"), e(4, "2026-06-01T00:00:00Z"), e(5, "2026-04-01T00:00:00Z", "pendiente")];
  assert.deepEqual(filtrarPorFechas(items, "2026-03-01", "2026-05-31").map((x) => x.id), [1, 2, 3]);
  assert.deepEqual(filtrarPorFechas(items, null, null).map((x) => x.id), [1, 2, 3, 4]);
  assert.deepEqual(filtrarPorFechas(items, null, null, false).map((x) => x.id), [1, 2, 5, 3, 4]);
  assert.deepEqual(filtrarPorFechas(items, "2026-05-11", null).map((x) => x.id), [4]);
  assert.deepEqual(filtrarPorFechas([], null, null), []);
});

test("tituloDeRango", () => {
  assert.equal(tituloDeRango("2026-03-01", "2026-05-31"), "del 1 de marzo al 31 de mayo de 2026");
  assert.equal(tituloDeRango("2025-12-01", "2026-02-28"), "del 1 de diciembre de 2025 al 28 de febrero de 2026");
  assert.equal(tituloDeRango("2026-03-01", null), "desde el 1 de marzo de 2026");
  assert.equal(tituloDeRango(null, "2026-05-31"), "hasta el 31 de mayo de 2026");
  assert.equal(tituloDeRango(null, null), "todos los trabajos");
});
