import { test } from "node:test";
import assert from "node:assert/strict";
import { filtrarYOrdenarTareas, groupTasksForTable } from "./filtrosTareas.ts";

const tareasBase = [
  {
    id: 1,
    titulo: "Tender la cama",
    descripcion: "Al levantarse",
    asignadoId: 10,
    asignado: { id: 10, nombre: "Tomás" },
    dificultad: "Facil",
    tiempoEjecucionEstimadoSeg: 300,
    fechaVencimiento: "2026-10-16T00:00:00.000Z",
    horaEjecucion: "2026-10-16T08:30:00.000Z",
    tipoRecurrencia: "Diaria",
    isChecklist: false,
    checklistItems: [],
    grupoTareaId: null,
  },
  {
    id: 2,
    titulo: "Limpiar el comedor",
    descripcion: "Mesa y sillas",
    asignadoId: 10,
    asignado: { id: 10, nombre: "Tomás" },
    dificultad: "Exigente",
    tiempoEjecucionEstimadoSeg: 1800,
    fechaVencimiento: "2026-10-17T00:00:00.000Z",
    horaEjecucion: "2026-10-17T13:00:00.000Z",
    tipoRecurrencia: "Unica",
    isChecklist: true,
    checklistItems: [{ id: 1, texto: "Barrer" }],
    grupoTareaId: "grupo-1",
  },
  {
    id: 3,
    titulo: "Limpiar el comedor",
    descripcion: "Mesa y sillas",
    asignadoId: 11,
    asignado: { id: 11, nombre: "Lucía" },
    dificultad: "Exigente",
    tiempoEjecucionEstimadoSeg: 1800,
    fechaVencimiento: "2026-10-17T00:00:00.000Z",
    horaEjecucion: "2026-10-17T13:00:00.000Z",
    tipoRecurrencia: "Unica",
    isChecklist: true,
    checklistItems: [{ id: 2, texto: "Barrer" }],
    grupoTareaId: "grupo-1",
  },
  {
    id: 4,
    titulo: "Ordenar biblioteca",
    descripcion: "",
    asignadoId: 11,
    asignado: { id: 11, nombre: "Lucía" },
    dificultad: "Media",
    tiempoEjecucionEstimadoSeg: 900,
    fechaVencimiento: "2026-10-15T00:00:00.000Z",
    horaEjecucion: null,
    tipoRecurrencia: "Semanal",
    isChecklist: false,
    checklistItems: [],
    grupoTareaId: null,
  },
];

test("groupTasksForTable agrupa por grupoTareaId y conserva todos los asignados", () => {
  const agrupadas = groupTasksForTable(tareasBase);
  assert.equal(agrupadas.length, 3);
  const grupal = agrupadas.find((t) => t.id === 2);
  assert.ok(grupal);
  assert.equal(grupal._isGrouped, true);
  assert.deepEqual(grupal._assignees.map((a: any) => a.id), [10, 11]);
});

test("filtrarYOrdenarTareas filtra por persona (incluyendo co-responsables)", () => {
  const agrupadas = groupTasksForTable(tareasBase);
  const deLucia = filtrarYOrdenarTareas(agrupadas, { personaId: 11 });
  assert.deepEqual(deLucia.map((t) => t.id), [4, 2]);
});

test("filtrarYOrdenarTareas filtra por dificultad, checklist y recurrencia", () => {
  const agrupadas = groupTasksForTable(tareasBase);

  assert.deepEqual(
    filtrarYOrdenarTareas(agrupadas, { dificultad: "Exigente" }).map((t) => t.id),
    [2]
  );
  assert.deepEqual(
    filtrarYOrdenarTareas(agrupadas, { checklist: "con" }).map((t) => t.id),
    [2]
  );
  assert.deepEqual(
    filtrarYOrdenarTareas(agrupadas, { checklist: "sin" }).map((t) => t.id),
    [4, 1]
  );
  assert.deepEqual(
    filtrarYOrdenarTareas(agrupadas, { recurrencia: "recurrente" }).map((t) => t.id),
    [4, 1]
  );
  assert.deepEqual(
    filtrarYOrdenarTareas(agrupadas, { recurrencia: "unica" }).map((t) => t.id),
    [2]
  );
});

test("filtrarYOrdenarTareas ordena por tiempo requerido y por fecha de vencimiento", () => {
  const agrupadas = groupTasksForTable(tareasBase);

  assert.deepEqual(
    filtrarYOrdenarTareas(agrupadas, { orden: "tiempo_asc" }).map((t) => t.id),
    [1, 4, 2]
  );
  assert.deepEqual(
    filtrarYOrdenarTareas(agrupadas, { orden: "tiempo_desc" }).map((t) => t.id),
    [2, 4, 1]
  );
  assert.deepEqual(
    filtrarYOrdenarTareas(agrupadas, { orden: "vencimiento_asc" }).map((t) => t.id),
    [4, 1, 2]
  );
  assert.deepEqual(
    filtrarYOrdenarTareas(agrupadas, { orden: "vencimiento_desc" }).map((t) => t.id),
    [2, 1, 4]
  );
});
