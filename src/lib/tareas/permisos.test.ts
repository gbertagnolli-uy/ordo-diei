import { test } from "node:test";
import assert from "node:assert/strict";
import { puedeCompletarTarea } from "./permisos.ts";

const tarea = { asignadoId: 5 };

test("el asignado puede completar su tarea", () => {
  assert.equal(puedeCompletarTarea({ id: 5, rolFamiliar: "Hijo" }, tarea), true);
});

test("Padre y Madre pueden completar la tarea de otro", () => {
  assert.equal(puedeCompletarTarea({ id: 1, rolFamiliar: "Padre" }, tarea), true);
  assert.equal(puedeCompletarTarea({ id: 2, rolFamiliar: "Madre" }, tarea), true);
});

test("un hermano (Hijo/Hija) no puede completar la tarea de otro", () => {
  assert.equal(puedeCompletarTarea({ id: 6, rolFamiliar: "Hijo" }, tarea), false);
  assert.equal(puedeCompletarTarea({ id: 7, rolFamiliar: "Hija" }, tarea), false);
  assert.equal(puedeCompletarTarea({ id: 6 }, tarea), false);
});

test("el id de la sesión como texto cuenta igual que como número", () => {
  assert.equal(puedeCompletarTarea({ id: "5", rolFamiliar: "Hija" }, tarea), true);
});
