import { test } from "node:test";
import assert from "node:assert/strict";
import { asistencia, horasTexto, periodoVigente, trimestresDelAnio, validarPeriodo } from "./boletin.ts";

test("trimestresDelAnio: tres cortes seguidos sin superponerse", () => {
  const t = trimestresDelAnio(2026);
  assert.equal(t.length, 3);
  assert.deepEqual(t.map((p) => p.inicio), ["2026-03-01", "2026-06-01", "2026-09-01"]);
  assert.ok(t[0].fin < t[1].inicio && t[1].fin < t[2].inicio);
  assert.ok(t.every((p) => validarPeriodo(p) === null));
});

test("asistencia y horasTexto", () => {
  assert.equal(asistencia(0, 0), null);
  assert.equal(asistencia(20, 19), 95);
  assert.equal(asistencia(3, 5), 100);
  assert.deepEqual([horasTexto(0), horasTexto(45), horasTexto(60), horasTexto(135)], ["0 h", "45 min", "1 h", "2 h 15 min"]);
});

test("validarPeriodo", () => {
  assert.equal(validarPeriodo({ nombre: " ", inicio: "2026-03-01", fin: "2026-05-31" }), "Falta el nombre del período");
  assert.equal(validarPeriodo({ nombre: "x", inicio: "2026-03-01", fin: "ayer" }), "Fechas no válidas");
  assert.equal(validarPeriodo({ nombre: "x", inicio: "2026-06-01", fin: "2026-05-31" }), "El inicio es posterior al fin");
});

test("periodoVigente: el que contiene hoy, si no el último que pasó, si no el primero", () => {
  const p = trimestresDelAnio(2026);
  assert.equal(periodoVigente(p, "2026-07-10")?.nombre, "Segundo trimestre 2026");
  assert.equal(periodoVigente(p, "2026-12-31")?.nombre, "Tercer trimestre 2026");
  assert.equal(periodoVigente(p, "2026-01-10")?.nombre, "Primer trimestre 2026");
  assert.equal(periodoVigente([], "2026-01-10"), null);
});
