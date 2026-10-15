import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { armarBoletin, borrarPeriodo, crearPeriodo, crearTrimestres, guardarComentarioBoletin, listarPeriodos } from "./boletin.ts";
import { crearNota } from "./calificaciones.ts";

// --- Sin base: permisos y validaciones previas ---
test("un Hijo no ve ni arma boletines ni períodos", async () => {
  const hijo = { id: 5, rol: "Hijo" };
  await assert.rejects(listarPeriodos(hijo), { status: 403 });
  await assert.rejects(armarBoletin(hijo, 5, 1), { status: 403 });
  await assert.rejects(crearPeriodo(hijo, { nombre: "x", inicio: "2026-03-01", fin: "2026-05-31" }), { status: 403 });
  await assert.rejects(crearTrimestres(hijo, 2026), { status: 403 });
  await assert.rejects(borrarPeriodo(hijo, 1), { status: 403 });
  await assert.rejects(guardarComentarioBoletin(hijo, 1, 5, "hola"), { status: 403 });
});

test("un período mal armado y un año absurdo se rechazan", async () => {
  const padre = { id: 1, rol: "Padre" };
  await assert.rejects(crearPeriodo(padre, { nombre: "", inicio: "2026-03-01", fin: "2026-05-31" }), { status: 400 });
  await assert.rejects(crearPeriodo(padre, { nombre: "x", inicio: "2026-06-01", fin: "2026-05-31" }), { status: 400 });
  await assert.rejects(crearTrimestres(padre, 1850), { status: 400 });
  await assert.rejects(guardarComentarioBoletin(padre, 1, 5, "x".repeat(2001)), { status: 400 });
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_bol_${Date.now()}`;
const ids = { padre: 0, hijo: 0, materia: 0, periodo: 0 };

before(async () => {
  if (sinBase) return;
  const u = (nombre: string, rolFamiliar: "Padre" | "Hijo") => prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });
  ids.padre = (await u("padre", "Padre")).id;
  ids.hijo = (await u("hijo", "Hijo")).id;
  ids.materia = (await prisma.materia.create({ data: { nombre: "M" + sufijo, creadorId: ids.padre } })).id;
});

after(async () => {
  if (!sinBase) {
    if (ids.periodo) await prisma.periodoCalificacion.deleteMany({ where: { id: ids.periodo } });
    await prisma.materia.deleteMany({ where: { id: ids.materia } });
    await prisma.usuario.deleteMany({ where: { id: { in: [ids.padre, ids.hijo].filter(Boolean) } } });
  }
  await prisma.$disconnect();
});

test("el boletín junta notas, lectura y comentario de un período", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const p = await crearPeriodo(padre, { nombre: "Período de prueba" + sufijo, inicio: "2031-03-01", fin: "2031-05-31" });
  ids.periodo = p.id;
  await crearNota(padre, { alumnoId: ids.hijo, materiaId: ids.materia, titulo: "Examen", tipo: "examen", puntaje: 80, fecha: "2031-04-01" });
  await crearNota(padre, { alumnoId: ids.hijo, materiaId: ids.materia, titulo: "Proyecto", tipo: "proyecto", puntaje: 100, fecha: "2031-04-10", comentario: "Muy prolijo" });
  await crearNota(padre, { alumnoId: ids.hijo, materiaId: ids.materia, titulo: "Fuera del período", puntaje: 10, fecha: "2031-09-01" });
  await guardarComentarioBoletin(padre, p.id, ids.hijo, "Un buen trimestre");

  const b = await armarBoletin(padre, ids.hijo, p.id, "2031-06-15");
  const m = b.materias.find((x) => x.materiaId === ids.materia)!;
  assert.deepEqual([m.promedio, m.letra, m.notas.length, m.comentarios], [90, "A", 2, ["Muy prolijo"]]);
  assert.deepEqual([b.promedio, b.comentario, b.asistencia.porcentaje], [90, "Un buen trimestre", null]);
  await assert.rejects(armarBoletin(padre, ids.padre, p.id), { status: 404 });
  await assert.rejects(armarBoletin(padre, ids.hijo, 999999999), { status: 404 });
});
