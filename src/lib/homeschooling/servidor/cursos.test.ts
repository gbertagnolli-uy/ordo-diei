import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { aFecha } from "../../habitos/server.ts";
import {
  borrarLeccion, borrarMateria, borrarRecurso, crearLeccion, crearMateria, crearRecurso, cursosDeMateria,
  editarLeccion, editarMateria, editarRecurso, leccionesDeCurso, reordenarLecciones, reordenarRecursos,
} from "./cursos.ts";

const hijo = { id: 999999, rol: "Hijo" };

// --- Permisos: un Hijo/Hija no escribe (se rechaza antes de tocar la base) ---
test("un Hijo no crea, edita ni borra materias, cursos ni lecciones", async () => {
  const sinPermiso = { status: 403 };
  await assert.rejects(crearMateria(hijo, { nombre: "X" }), sinPermiso);
  await assert.rejects(editarMateria(hijo, 1, { nombre: "Y" }), sinPermiso);
  await assert.rejects(borrarMateria(hijo, 1), sinPermiso);
  await assert.rejects(crearRecurso(hijo, { materiaId: 1, titulo: "X", tipo: "libro", unidadTipo: "pagina", totalUnidades: 10 }), sinPermiso);
  await assert.rejects(editarRecurso(hijo, 1, { titulo: "Y" }), sinPermiso);
  await assert.rejects(borrarRecurso(hijo, 1), sinPermiso);
  await assert.rejects(reordenarRecursos(hijo, 1, [1]), sinPermiso);
  await assert.rejects(crearLeccion(hijo, { recursoId: 1, titulo: "X" }, "2030-01-01"), sinPermiso);
  await assert.rejects(editarLeccion(hijo, 1, { titulo: "Y" }), sinPermiso);
  await assert.rejects(borrarLeccion(hijo, 1, "2030-01-01"), sinPermiso);
  await assert.rejects(reordenarLecciones(hijo, 1, [1]), sinPermiso);
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 (la base de DATABASE_URL es la de producción) ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_cursos_${Date.now()}`;
const ids = { padre: 0, hijo: 0, otro: 0, materia: 0, recurso: 0 };
const nuevoUsuario = (nombre: string, rolFamiliar: "Padre" | "Hijo") =>
  prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });

before(async () => {
  if (sinBase) return;
  ids.padre = (await nuevoUsuario("padre", "Padre")).id;
  ids.hijo = (await nuevoUsuario("hijo", "Hijo")).id;
  ids.otro = (await nuevoUsuario("otro", "Hijo")).id;
});

after(async () => {
  if (sinBase) return;
  const usuarios = [ids.padre, ids.hijo, ids.otro].filter(Boolean);
  await prisma.materia.deleteMany({ where: { creadorId: { in: usuarios } } });
  await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } });
  await prisma.$disconnect();
});

test("lecciones: reordenar 1↔3 sin violar el unique; el total sigue a las lecciones", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const materia = await crearMateria(padre, { nombre: "Ciencias" + sufijo });
  ids.materia = materia.id;
  const curso = await crearRecurso(padre, { materiaId: materia.id, titulo: "Videos" + sufijo, tipo: "curso_videos", unidadTipo: "leccion" });
  ids.recurso = curso.id;
  const l = [];
  for (const t of ["A", "B", "C"]) l.push(await crearLeccion(padre, { recursoId: curso.id, titulo: t, url: t === "A" ? "https://youtu.be/dQw4w9WgXcQ" : null }, "2030-03-12"));
  assert.equal(l[0].video_platform, "youtube");
  assert.equal((await prisma.recursoCurso.findUniqueOrThrow({ where: { id: curso.id } })).totalUnidades, 3);

  await reordenarLecciones(padre, curso.id, [l[2].id, l[1].id, l[0].id]);
  const orden = (await leccionesDeCurso(padre, curso.id, null)).map((x) => x.title);
  assert.deepEqual(orden, ["C", "B", "A"]);
  await assert.rejects(reordenarLecciones(padre, curso.id, [l[0].id]), { status: 400 });
});

test("borrar una lección cubierta por un día hecho da 409; las demás renumeran", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const lecciones = await leccionesDeCurso(padre, ids.recurso, null);
  const plan = await prisma.planCurso.create({
    data: { recursoId: ids.recurso, alumnoId: ids.hijo, inicio: aFecha("2030-03-04"), fin: aFecha("2030-03-29"), diasSemana: [1, 2, 3, 4, 5] },
  });
  await prisma.diaLectivo.create({ data: { planId: plan.id, fecha: aFecha("2030-03-04"), unidadDesde: 1, unidadHasta: 1, estado: "hecha" } });
  await assert.rejects(borrarLeccion(padre, lecciones[0].id, "2030-03-12"), { status: 409 });
  await borrarLeccion(padre, lecciones[2].id, "2030-03-12");
  const quedan = await leccionesDeCurso(padre, ids.recurso, ids.hijo);
  assert.deepEqual(quedan.map((x) => x.display_order), [1, 2]);
  assert.equal(quedan[0].is_completed, true);
});

test("un Hijo solo lee lo que tiene un plan suyo", { skip: sinBase }, async () => {
  const mio = { id: ids.hijo, rol: "Hijo" };
  const ajeno = { id: ids.otro, rol: "Hijo" };
  const cursos = await cursosDeMateria(mio, ids.materia, null, true);
  assert.equal(cursos.length, 1);
  assert.equal(cursos[0].progress_percentage, 50);
  await assert.rejects(cursosDeMateria(ajeno, ids.materia, ids.hijo, true), { status: 403 });
  await assert.rejects(leccionesDeCurso(ajeno, ids.recurso, null), { status: 403 });
});
