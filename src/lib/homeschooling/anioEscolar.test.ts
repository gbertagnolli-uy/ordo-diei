import { test } from "node:test";
import assert from "node:assert/strict";
import { esDiaHabil, expandirDiasSinClase, MAX_DIAS_RANGO, validarRango } from "./anioEscolar.ts";

test("esDiaHabil: de lunes a viernes", () => {
  assert.deepEqual(["2026-10-12", "2026-10-16", "2026-10-17", "2026-10-18"].map(esDiaHabil), [true, true, false, false]);
});

test("expandirDiasSinClase: solo días de semana del rango, más las fiestas, sin repetir y ordenado", () => {
  const r = expandirDiasSinClase(
    [{ motivo: " Vacaciones de invierno ", desde: "2026-07-06", hasta: "2026-07-19" }],
    [{ fecha: "2026-07-08", motivo: "Se repite" }, { fecha: "2026-06-29", motivo: "San Pedro y San Pablo" }, { fecha: "2026-08-15", motivo: "" }]
  );
  assert.equal(r.length, 10 + 2);
  assert.deepEqual([r[0], r[1]], [{ fecha: "2026-06-29", motivo: "San Pedro y San Pablo" }, { fecha: "2026-07-06", motivo: "Vacaciones de invierno" }]);
  assert.equal(r.find((d) => d.fecha === "2026-07-08")?.motivo, "Vacaciones de invierno");
  assert.equal(r.find((d) => d.fecha === "2026-07-11"), undefined);
  assert.equal(r.at(-1)?.motivo, "Fiesta");
  assert.deepEqual(expandirDiasSinClase([], []), []);
});

test("validarRango", () => {
  assert.equal(validarRango({ motivo: "", desde: "2026-07-01", hasta: "2026-07-10" }), "Falta el nombre de las vacaciones");
  assert.equal(validarRango({ motivo: "x", desde: "hoy", hasta: "2026-07-10" }), "Fechas no válidas");
  assert.match(validarRango({ motivo: "x", desde: "2026-07-10", hasta: "2026-07-01" }) ?? "", /posterior/);
  assert.match(validarRango({ motivo: "x", desde: "2026-01-01", hasta: "2026-12-31" }) ?? "", /demasiado largo/);
  assert.equal(validarRango({ motivo: "x", desde: "2026-07-01", hasta: "2026-07-14" }), null);
  assert.ok(MAX_DIAS_RANGO >= 60);
});
