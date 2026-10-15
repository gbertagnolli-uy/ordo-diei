import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { borrarNota, calificarDia, crearNota, editarNota, libretaDe } from "./calificaciones.ts";

const hijo = { id: 999999, rol: "Hijo" };
const padre = { id: 1, rol: "Padre" };

// --- Sin base: permisos y validaciones que se rechazan antes de consultar ---
test("un Hijo no ve la libreta ni califica", async () => {
  await assert.rejects(libretaDe(hijo, 1), { status: 403 });
  await assert.rejects(crearNota(hijo, { alumnoId: 1, materiaId: 1, titulo: "x", puntaje: 90, fecha: "2026-10-01" }), { status: 403 });
  await assert.rejects(calificarDia(hijo, 1, 90), { status: 403 });
  await assert.rejects(editarNota(hijo, 1, { puntaje: 50 }), { status: 403 });
  await assert.rejects(borrarNota(hijo, 1), { status: 403 });
});

test("la nota va de 0 a 100, entera; título y fecha obligatorios", async () => {
  for (const puntaje of [-1, 101, 7.5, NaN]) await assert.rejects(calificarDia(padre, 1, puntaje), { status: 400 }, String(puntaje));
  await assert.rejects(crearNota(padre, { alumnoId: 1, materiaId: 1, titulo: "  ", puntaje: 90, fecha: "2026-10-01" }), { status: 400 });
  await assert.rejects(crearNota(padre, { alumnoId: 1, materiaId: 1, titulo: "x", puntaje: 90, fecha: "mañana" }), { status: 400 });
  await assert.rejects(editarNota(padre, 1, { puntaje: 120 }), { status: 400 });
  await assert.rejects(editarNota(padre, 1, { titulo: "" }), { status: 400 });
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_cal_${Date.now()}`;
const ids = { padre: 0, hijo: 0, materia: 0 };

before(async () => {
  if (sinBase) return;
  const u = (nombre: string, rolFamiliar: "Padre" | "Hijo") => prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });
  ids.padre = (await u("padre", "Padre")).id;
  ids.hijo = (await u("hijo", "Hijo")).id;
  ids.materia = (await prisma.materia.create({ data: { nombre: "Materia" + sufijo, creadorId: ids.padre } })).id;
});

after(async () => {
  if (!sinBase) {
    await prisma.materia.deleteMany({ where: { id: ids.materia } });
    await prisma.usuario.deleteMany({ where: { id: { in: [ids.padre, ids.hijo].filter(Boolean) } } });
  }
  await prisma.$disconnect();
});

test("libreta: notas sueltas, promedio por materia y general", { skip: sinBase }, async () => {
  const p = { id: ids.padre, rol: "Padre" };
  const n1 = await crearNota(p, { alumnoId: ids.hijo, materiaId: ids.materia, titulo: "Examen 1", tipo: "examen", puntaje: 80, fecha: "2031-02-01" });
  await crearNota(p, { alumnoId: ids.hijo, materiaId: ids.materia, titulo: "Proyecto", tipo: "proyecto", puntaje: 100, fecha: "2031-02-10", comentario: "Muy bien" });
  const l = await libretaDe(p, ids.hijo);
  const m = l.materias.find((x) => x.materiaId === ids.materia)!;
  assert.deepEqual([m.promedio, m.letra, m.notas.length, l.cantidad, l.promedio], [90, "A", 2, 2, 90]);
  assert.equal(m.notas[0].titulo, "Proyecto");
  await editarNota(p, n1.id, { puntaje: 60 });
  assert.equal((await libretaDe(p, ids.hijo)).promedio, 80);
  await borrarNota(p, n1.id);
  assert.equal((await libretaDe(p, ids.hijo)).cantidad, 1);
  await assert.rejects(borrarNota(p, n1.id), { status: 404 });
  await assert.rejects(libretaDe(p, ids.padre), { status: 404 });
});
