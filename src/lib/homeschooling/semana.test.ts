import { test } from "node:test";
import assert from "node:assert/strict";
import { diasDeSemana, esFechaValida, etiquetaDia, lunesDe, sumarDias } from "./semana.ts";

test("lunesDe: de lunes a domingo es la misma semana", () => {
  for (const d of ["2026-10-12", "2026-10-13", "2026-10-15", "2026-10-18"]) assert.equal(lunesDe(d), "2026-10-12", d);
  assert.equal(lunesDe("2026-10-19"), "2026-10-19");
  assert.equal(lunesDe("2026-01-01"), "2025-12-29");
});

test("sumarDias cruza meses y años", () => {
  assert.equal(sumarDias("2026-10-31", 1), "2026-11-01");
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(sumarDias("2026-03-01", -1), "2026-02-28");
});

test("diasDeSemana: siete días seguidos", () => {
  const d = diasDeSemana("2026-10-12");
  assert.equal(d.length, 7);
  assert.deepEqual([d[0], d[4], d[6]], ["2026-10-12", "2026-10-16", "2026-10-18"]);
});

test("esFechaValida y etiquetaDia", () => {
  assert.equal(esFechaValida("2026-02-30"), false);
  assert.equal(esFechaValida("hoy"), false);
  assert.equal(esFechaValida("2026-10-12"), true);
  assert.equal(etiquetaDia("2026-10-12"), "lunes 12");
  assert.equal(etiquetaDia("2026-10-18"), "domingo 18");
  assert.equal(etiquetaDia("2026-10-14"), "miércoles 14");
});
