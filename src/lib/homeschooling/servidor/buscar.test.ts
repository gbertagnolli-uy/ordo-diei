import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { buscarEnEstudio } from "./buscar.ts";

after(async () => {
  await prisma.$disconnect();
});
before(() => {});

test("menos de 2 letras no consulta nada", async () => {
  assert.deepEqual(await buscarEnEstudio({ id: 1, rol: "Padre" }, ""), []);
  assert.deepEqual(await buscarEnEstudio({ id: 1, rol: "Padre" }, " a "), []);
});

// Lectura solamente (no escribe): comprueba que las consultas del padre y del hijo son válidas contra la base real
test("el padre y un hijo pueden buscar sin error (solo lectura)", async () => {
  const padre = await buscarEnEstudio({ id: 1, rol: "Padre" }, "mat");
  assert.ok(Array.isArray(padre));
  const hijo = await buscarEnEstudio({ id: 999999, rol: "Hijo" }, "mat");
  assert.deepEqual(hijo.filter((r) => r.tipo !== "evidencia" && r.tipo !== "actividad" && r.tipo !== "material"), []);
});
