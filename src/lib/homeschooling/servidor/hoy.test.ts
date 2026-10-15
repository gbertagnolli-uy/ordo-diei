import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { aFecha } from "../../habitos/server.ts";
import { crearPlan } from "./planes.ts";
import { asegurarTareasDeHoy } from "./tareas.ts";
import { completarLeccion } from "./progreso.ts";
import { motivoBloqueoTarea } from "./guardia.ts";
import { leccionesDeHoy } from "./hoy.ts";

// Escribe en la base de DATABASE_URL, que hoy es la de producción: solo corre con PERMITIR_TESTS_DB=1
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_hoy_${Date.now()}`;
const ids = { padre: 0, hijo: 0, hermano: 0, materia: 0, recurso: 0, l1: 0, l2: 0 };
const HOY = "2030-03-12";

before(async () => {
  if (sinBase) return;
  const u = (nombre: string, rolFamiliar: "Padre" | "Hijo") =>
    prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });
  ids.padre = (await u("padre", "Padre")).id;
  ids.hijo = (await u("hijo", "Hijo")).id;
  ids.hermano = (await u("hermano", "Hijo")).id;
  ids.materia = (await prisma.materia.create({ data: { nombre: "Mate" + sufijo, creadorId: ids.padre } })).id;
  const r = await prisma.recursoCurso.create({
    data: { materiaId: ids.materia, titulo: "Curso" + sufijo, creadorId: ids.padre, tipo: "curso_videos", unidadTipo: "leccion", totalUnidades: 2 },
  });
  ids.recurso = r.id;
  ids.l1 = (await prisma.leccionCurso.create({ data: { recursoId: r.id, orden: 1, titulo: "Uno", creadorId: ids.padre } })).id;
  ids.l2 = (await prisma.leccionCurso.create({ data: { recursoId: r.id, orden: 2, titulo: "Dos", creadorId: ids.padre } })).id;
  // Un solo día lectivo (hoy) con las dos lecciones
  await crearPlan({ actorId: ids.padre, alumnoId: ids.hijo, recursoId: r.id, inicio: HOY, fin: HOY, diasSemana: [1, 2, 3, 4, 5, 6, 7] });
});

after(async () => {
  if (sinBase) return;
  const usuarios = [ids.padre, ids.hijo, ids.hermano].filter(Boolean);
  await prisma.tarea.deleteMany({ where: { creadorId: { in: usuarios } } });
  await prisma.materia.deleteMany({ where: { id: ids.materia || -1 } });
  await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } });
  await prisma.$disconnect();
});

test("dos llamadas simultáneas crean una sola Tarea, con el creador del recurso", { skip: sinBase }, async () => {
  await Promise.all([asegurarTareasDeHoy(ids.hijo, HOY), asegurarTareasDeHoy(ids.hijo, HOY)]);
  const tareas = await prisma.tarea.findMany({ where: { asignadoId: ids.hijo } });
  assert.equal(tareas.length, 1);
  assert.equal(tareas[0].creadorId, ids.padre);
  assert.equal(tareas[0].generaPuntosYRecompensa, true);
});

test("la guardia bloquea la Tarea hasta terminar las lecciones; un hermano no completa", { skip: sinBase }, async () => {
  const tarea = await prisma.tarea.findFirstOrThrow({ where: { asignadoId: ids.hijo } });
  assert.ok(await motivoBloqueoTarea(tarea.id));
  await assert.rejects(completarLeccion(ids.hermano, ids.l1, HOY), { status: 403 });
  await assert.rejects(completarLeccion(ids.hijo, ids.l2, HOY), { status: 409 }); // la 2 exige la 1
  assert.equal((await completarLeccion(ids.hijo, ids.l1, HOY)).ultimaDelDia, false);
  const ultima = await completarLeccion(ids.hijo, ids.l2, HOY);
  assert.equal(ultima.ultimaDelDia, true);
  assert.equal(ultima.tareaId, tarea.id);
  assert.equal(await motivoBloqueoTarea(tarea.id), null);
  assert.equal((await completarLeccion(ids.hijo, ids.l2, HOY)).ultimaDelDia, true); // idempotente
});

test("hoy lista el día con sus lecciones completadas", { skip: sinBase }, async () => {
  const dias = await leccionesDeHoy(ids.hijo, HOY);
  assert.equal(dias.length, 1);
  assert.ok(dias[0].lecciones.every((l) => l.completada));
  assert.equal(aFecha(HOY).toISOString().slice(0, 10), dias[0].fecha);
});
