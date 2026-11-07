import { test } from "node:test";
import assert from "node:assert/strict";
import { armarSemana, domingoDe, lunesDe } from "./agendaSemanal.ts";

test("lunesDe: un domingo devuelve el lunes anterior; un lunes se devuelve a sí mismo", () => {
  const domingo = new Date(2026, 10, 8, 15, 30); // dom 8/11/2026
  assert.equal(lunesDe(domingo).getTime(), new Date(2026, 10, 2).getTime());
  const lunes = new Date(2026, 10, 2, 9, 0);
  assert.equal(lunesDe(lunes).getTime(), new Date(2026, 10, 2).getTime());
});

test("domingoDe: último instante del domingo", () => {
  assert.equal(domingoDe(new Date(2026, 10, 2)).getTime(), new Date(2026, 10, 8, 23, 59, 59, 999).getTime());
});

test("armarSemana: ubica por día, ordena por hora y deja las sin hora al final", () => {
  const lunes = new Date(2026, 10, 2);
  const ev = (id: string, start: Date, allDay: boolean, resource: Record<string, unknown> = {}) => ({ id, title: id, start, end: start, allDay, resource });
  const dias = armarSemana(
    [
      ev("tarde", new Date(2026, 10, 3, 18, 0), false),
      ev("sin-hora", new Date(2026, 10, 3), true),
      ev("mañana", new Date(2026, 10, 3, 8, 5), false, {
        tiempoEjecucionEstimadoSeg: 1800,
        checklistItems: [{ texto: "Tender la cama" }],
        asignados: [{ id: 7, nombre: "Ana" }, { id: 9, nombre: "Luis" }],
      }),
      ev("otra-semana", new Date(2026, 10, 10, 8, 0), false),
    ],
    lunes,
    7,
  );
  assert.equal(dias.length, 7);
  assert.deepEqual(dias[1].items.map((i) => i.id), ["mañana", "tarde", "sin-hora"]);
  assert.equal(dias[1].items[0].hora, "08:05");
  assert.equal(dias[1].items[0].duracionMin, 30);
  assert.deepEqual(dias[1].items[0].checklist, ["Tender la cama"]);
  assert.deepEqual(dias[1].items[0].companeros, ["Luis"]);
  assert.equal(dias[1].items[2].hora, null);
  assert.equal(dias.flatMap((d) => d.items).length, 3);
});
