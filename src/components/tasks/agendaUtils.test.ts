import { test } from "node:test";
import assert from "node:assert/strict";
import { esPlantillaBase, estadoEnAgenda, tareasDeAgenda } from "./agendaUtils.ts";

// Sábado 7 de noviembre de 2026, 10:00
const hoy = new Date(2026, 10, 7, 10, 0, 0);
const plantilla = {
  id: 22,
  titulo: "Rezar el Ángelus",
  asignadoId: 3,
  tipoRecurrencia: "Diaria",
  estado: "No_Realizada",
  fechaVencimiento: new Date(2026, 10, 2, 12, 0, 0),
  horaEjecucion: new Date(2026, 10, 2, 12, 0, 0),
};
const instancia = {
  id: 28,
  titulo: "Rezar el Ángelus",
  asignadoId: 3,
  tipoRecurrencia: "Unica",
  estado: "Pendiente",
  parentTaskId: 22,
  generadaPorCron: true,
  fechaVencimiento: new Date(2026, 10, 7, 12, 0, 0),
  horaEjecucion: new Date(2026, 10, 7, 12, 0, 0),
};
const unica = {
  id: 5,
  titulo: "Ordenar el cuarto",
  asignadoId: 3,
  tipoRecurrencia: "Unica",
  estado: "Pendiente",
  fechaVencimiento: new Date(2026, 10, 7, 18, 0, 0),
  horaEjecucion: new Date(2026, 10, 7, 18, 0, 0),
};
const tareas = [plantilla, instancia, unica];

test("esPlantillaBase distingue la regla de sus instancias", () => {
  assert.equal(esPlantillaBase(plantilla), true);
  assert.equal(esPlantillaBase(instancia), false);
  assert.equal(esPlantillaBase(unica), false);
  assert.equal(esPlantillaBase({ id: 9, tipoRecurrencia: "Unica", rotacionConfig: { modo: "x" } }), true);
});

test("Pendientes (sin día) no muestra plantillas", () => {
  const ids = tareasDeAgenda(tareas, undefined, 3).map((t) => t.id).sort((a, b) => a - b);
  assert.deepEqual(ids, [5, 28]);
});

test("el día con instancia muestra la instancia y oculta la plantilla", () => {
  const ids = tareasDeAgenda(tareas, hoy, 3).map((t) => t.id).sort((a, b) => a - b);
  assert.deepEqual(ids, [5, 28]);
});

test("un día futuro sin instancia muestra la plantilla «Programada»", () => {
  const dia10 = new Date(2026, 10, 10);
  const lista = tareasDeAgenda(tareas, dia10, 3);
  assert.deepEqual(lista.map((t) => t.id), [22]);
  assert.equal(estadoEnAgenda(lista[0]).label, "Programada");
  assert.equal(estadoEnAgenda({ ...unica, fechaVencimiento: new Date(Date.now() + 86_400_000) }).label, "Pendiente");
});
