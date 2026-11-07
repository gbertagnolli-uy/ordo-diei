import { test } from "node:test";
import assert from "node:assert/strict";
import { esVisible, estadoPremio, porcentajeGrupal, seSolapan, validarPremioGrupal } from "./premioGrupal.ts";

test("porcentajeGrupal: redondea hacia abajo, 0 sin tareas, tope 100", () => {
  assert.equal(porcentajeGrupal(2, 3), 66);
  assert.equal(porcentajeGrupal(0, 0), 0);
  assert.equal(porcentajeGrupal(5, 4), 100);
});

test("validarPremioGrupal: acepta lo correcto y rechaza lo inválido", () => {
  const ok = validarPremioGrupal({ titulo: "  Una salida al parque ", porcentajeMeta: 80, desde: "2026-11-02", hasta: "2026-11-29" });
  assert.equal(ok.titulo, "Una salida al parque");
  assert.equal(ok.descripcion, null);
  assert.throws(() => validarPremioGrupal({ titulo: "ab", porcentajeMeta: 80, desde: "2026-11-02", hasta: "2026-11-29" }));
  assert.throws(() => validarPremioGrupal({ titulo: "Premio", porcentajeMeta: 0, desde: "2026-11-02", hasta: "2026-11-29" }));
  assert.throws(() => validarPremioGrupal({ titulo: "Premio", porcentajeMeta: 80, desde: "2026-11-29", hasta: "2026-11-02" }));
  assert.throws(() => validarPremioGrupal({ titulo: "Premio", porcentajeMeta: 80, desde: "2026-01-01", hasta: "2026-12-31" }));
});

test("estadoPremio y esVisible", () => {
  const p = { desde: "2026-11-02", hasta: "2026-11-08", evaluado: false, cumplido: null };
  assert.equal(estadoPremio(p, "2026-11-01"), "proximo");
  assert.equal(estadoPremio(p, "2026-11-08"), "en-curso");
  assert.equal(estadoPremio(p, "2026-11-09"), "por-evaluar");
  assert.equal(estadoPremio({ ...p, evaluado: true, cumplido: true }, "2026-11-09"), "logrado");
  assert.equal(esVisible(p, "2026-11-15"), true);
  assert.equal(esVisible(p, "2026-11-16"), false);
  assert.equal(esVisible(p, "2026-11-01"), false);
});

test("seSolapan", () => {
  assert.equal(seSolapan({ desde: "2026-11-01", hasta: "2026-11-10" }, { desde: "2026-11-10", hasta: "2026-11-20" }), true);
  assert.equal(seSolapan({ desde: "2026-11-01", hasta: "2026-11-09" }, { desde: "2026-11-10", hasta: "2026-11-20" }), false);
});
