import { test } from "node:test";
import assert from "node:assert/strict";
import { paginasNuevas, porcentajeLeido, rachaDeLectura, resumirLectura } from "./lectura.ts";

test("porcentajeLeido", () => {
  assert.equal(porcentajeLeido(50, 200), 25);
  assert.equal(porcentajeLeido(250, 200), 100);
  assert.equal(porcentajeLeido(-5, 200), 0);
  assert.equal(porcentajeLeido(10, null), null);
  assert.equal(porcentajeLeido(10, 0), null);
});

test("rachaDeLectura: cuenta hacia atrás; si hoy no leyó todavía, empieza en ayer", () => {
  assert.equal(rachaDeLectura(["2026-10-14", "2026-10-15", "2026-10-16"], "2026-10-16"), 3);
  assert.equal(rachaDeLectura(["2026-10-14", "2026-10-15"], "2026-10-16"), 2);
  assert.equal(rachaDeLectura(["2026-10-13", "2026-10-15"], "2026-10-16"), 1);
  assert.equal(rachaDeLectura(["2026-10-10"], "2026-10-16"), 0);
  assert.equal(rachaDeLectura([], "2026-10-16"), 0);
});

test("resumirLectura: ventana de siete días contando hoy", () => {
  const r = resumirLectura(
    [
      { fecha: "2026-10-16", paginas: 10, minutos: 20 },
      { fecha: "2026-10-16", paginas: 5, minutos: null },
      { fecha: "2026-10-10", paginas: 7, minutos: 15 },
      { fecha: "2026-10-09", paginas: 99, minutos: 99 },
    ],
    "2026-10-16",
    3
  );
  assert.deepEqual(r, { paginasSemana: 22, minutosSemana: 35, diasSemana: 2, racha: 1, librosLeidosAnio: 3 });
});

test("paginasNuevas: no baja, no pasa del total y rechaza lo inválido", () => {
  assert.deepEqual(paginasNuevas(10, 25, 200), { pagina: 25, leidas: 15 });
  assert.deepEqual(paginasNuevas(10, 300, 200), { pagina: 200, leidas: 190 });
  assert.deepEqual(paginasNuevas(40, 30, 200), { pagina: 30, leidas: 0 });
  assert.deepEqual(paginasNuevas(0, 12, null), { pagina: 12, leidas: 12 });
  assert.equal(paginasNuevas(0, -1, null), null);
  assert.equal(paginasNuevas(0, 1.5, null), null);
});
