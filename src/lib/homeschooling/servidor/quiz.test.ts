import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import prisma from "../../prisma.ts";
import { calificarFinal, crearTarjeta, fallosSeguidos, guardarPreguntas, preguntasParaAlumno, responderCheckpoint } from "./quiz.ts";
import { crearPlan } from "./planes.ts";
import { completarLeccion } from "./progreso.ts";
import { repasosDeHoy, responderRepaso } from "./repasos.ts";

const fuente = readFileSync(new URL("./quiz.ts", import.meta.url), "utf8");

// --- Sin base ---
test("preguntasParaAlumno no pide ni devuelve `correcta` ni `explicacion` (test de forma)", () => {
  const cuerpo = fuente.slice(fuente.indexOf("export async function preguntasParaAlumno"), fuente.indexOf("/** Para el editor del padre"));
  assert.match(cuerpo, /select:\s*\{[^}]*enunciado[^}]*\}/);
  assert.ok(!/correcta|explicacion/.test(cuerpo.replace(/\/\*\*[^]*?\*\//g, "").replace(/\/\/.*$/gm, "")), "el select público no debe incluir la respuesta");
});

test("la respuesta de calificarFinal no incluye el índice correcto, solo acierto y explicación", () => {
  const cuerpo = fuente.slice(fuente.indexOf("detalle:"), fuente.indexOf("fallosSeguidos: fallos"));
  assert.ok(cuerpo.includes("acierto:") && cuerpo.includes("explicacion:"));
  assert.ok(!/correcta\s*:/.test(cuerpo));
});

test("un Hijo no edita preguntas ni ve las completas", async () => {
  await assert.rejects(guardarPreguntas({ id: 1, rol: "Hijo" }, 1, [{ enunciado: "x", opciones: ["a", "b"], correcta: 0 }]), { status: 403 });
});

test("las preguntas inválidas se rechazan antes de tocar la base", async () => {
  await assert.rejects(guardarPreguntas({ id: 1, rol: "Padre" }, 1, [{ enunciado: "x", opciones: ["a"], correcta: 0 }]), { status: 400 });
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_quiz_${Date.now()}`;
const ids = { padre: 0, hijo: 0, materia: 0, recurso: 0, l1: 0, l2: 0, p1: 0 };
const HOY = "2030-03-12";

before(async () => {
  if (sinBase) return;
  const u = (nombre: string, rolFamiliar: "Padre" | "Hijo") =>
    prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });
  ids.padre = (await u("padre", "Padre")).id;
  ids.hijo = (await u("hijo", "Hijo")).id;
  ids.materia = (await prisma.materia.create({ data: { nombre: "Mate" + sufijo, creadorId: ids.padre } })).id;
  const r = await prisma.recursoCurso.create({
    data: { materiaId: ids.materia, titulo: "Curso" + sufijo, creadorId: ids.padre, tipo: "curso_videos", unidadTipo: "leccion", totalUnidades: 2 },
  });
  ids.recurso = r.id;
  ids.l1 = (await prisma.leccionCurso.create({ data: { recursoId: r.id, orden: 1, titulo: "Uno", creadorId: ids.padre } })).id;
  ids.l2 = (await prisma.leccionCurso.create({ data: { recursoId: r.id, orden: 2, titulo: "Dos", creadorId: ids.padre } })).id;
  await crearPlan({ actorId: ids.padre, alumnoId: ids.hijo, recursoId: r.id, inicio: HOY, fin: HOY, diasSemana: [1, 2, 3, 4, 5, 6, 7] });
});

after(async () => {
  if (sinBase) return;
  const usuarios = [ids.padre, ids.hijo].filter(Boolean);
  await prisma.tarea.deleteMany({ where: { creadorId: { in: usuarios } } });
  await prisma.materia.deleteMany({ where: { id: ids.materia || -1 } });
  await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } });
  await prisma.$disconnect();
});

test("quiz final: reprobar bloquea, aprobar completa; 2 fallos crean una tarjeta de repaso", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const yo = { id: ids.hijo, rol: "Hijo" };
  await guardarPreguntas(padre, ids.l1, [
    { enunciado: "¿2+2?", opciones: ["3", "4"], correcta: 1, explicacion: "Dos y dos son cuatro" },
    { enunciado: "¿3+3?", opciones: ["6", "7"], correcta: 0 },
    { enunciado: "Checkpoint", opciones: ["a", "b"], correcta: 0, segundoVideo: 30 },
  ]);
  const publicas = await preguntasParaAlumno(yo, ids.l1, "final");
  assert.equal(publicas.length, 2);
  assert.ok(publicas.every((p) => !("correcta" in p) && !("explicacion" in p)));
  assert.equal((await responderCheckpoint(yo, ids.l1, (await preguntasParaAlumno(yo, ids.l1, "checkpoint"))[0].id, 1)).correcta, false);

  // Sin aprobar el quiz no se puede completar la lección
  await assert.rejects(completarLeccion(ids.hijo, ids.l1, HOY), { status: 409 });
  const [p1, p2] = publicas;
  const mal = await calificarFinal(yo, ids.l1, { [p1.id]: 0, [p2.id]: 1 }, HOY);
  assert.deepEqual([mal.nota, mal.aprobado], [0, false]);
  assert.equal(await fallosSeguidos(ids.hijo, ids.l1), 1);
  assert.equal((await prisma.tarjetaRepaso.count({ where: { alumnoId: ids.hijo } })), 0);
  await calificarFinal(yo, ids.l1, { [p1.id]: 0, [p2.id]: 1 }, HOY);
  assert.equal((await prisma.tarjetaRepaso.count({ where: { alumnoId: ids.hijo, leccionId: ids.l1 } })), 1);

  const bien = await calificarFinal(yo, ids.l1, { [p1.id]: 1, [p2.id]: 0 }, HOY);
  assert.deepEqual([bien.nota, bien.aprobado], [100, true]);
  assert.equal(await prisma.progresoLeccion.count({ where: { alumnoId: ids.hijo, leccionId: ids.l1 } }), 1);
});

test("repaso: la tarjeta aparece hoy y responder la reprograma", { skip: sinBase }, async () => {
  const yo = { id: ids.hijo, rol: "Hijo" };
  await crearTarjeta(ids.hijo, ids.l1, new Date("2030-03-01T12:00:00Z"));
  const hoy = await repasosDeHoy(ids.hijo, HOY);
  assert.equal(hoy.length, 1);
  assert.ok(!("correcta" in hoy[0].pregunta));
  const r = await responderRepaso(ids.hijo, hoy[0].tarjetaId, hoy[0].pregunta.id, 1, new Date("2030-03-12T12:00:00Z"));
  assert.equal(typeof r.correcta, "boolean");
  assert.ok(await prisma.tarjetaRepaso.findFirst({ where: { alumnoId: ids.hijo, proximo: { gt: new Date("2030-03-12T12:00:00Z") } } }));
  void yo;
});
