// Preguntas, checkpoints y quiz final. La corrección es SIEMPRE acá (HD9): `correcta` no sale nunca del servidor antes de
// responder, y después solo se informa acierto/fallo y la explicación (no el índice, para que no se memorice).
import prisma from "../../prisma.ts";
import { hoyEnFamilia, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { calcularNota, fallosSeguidosDe, validarPreguntas, type PreguntaEditable } from "../quiz.ts";
import { DatoInvalidoError } from "./planes.ts";
import { completarLeccion } from "./progreso.ts";
import { nuevaTarjeta } from "./repaso.ts";

export type Actor = { id: number; rol: string };

export type PreguntaPublica = { id: number; orden: number; segundoVideo: number | null; enunciado: string; opciones: string[] };

const aOpciones = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

/** La lección existe y el alumno la tiene en un plan (o es un padre) */
async function leccionAccesible(a: Actor, leccionId: number) {
  const leccion = await prisma.leccionCurso.findUnique({ where: { id: leccionId }, include: { recurso: { select: { id: true, umbralAprobacion: true } } } });
  if (!leccion) throw new NoEncontradoError("Lección no encontrada");
  if (!esPadre(a.rol) && !(await prisma.planCurso.findFirst({ where: { alumnoId: a.id, recursoId: leccion.recursoId }, select: { id: true } }))) {
    throw new NoAutorizadoError("Esta lección no es tuya");
  }
  return leccion;
}

/** Lo único que ve el alumno de una pregunta: sin `correcta` ni `explicacion` */
export async function preguntasParaAlumno(a: Actor, leccionId: number, tipo: "checkpoint" | "final"): Promise<PreguntaPublica[]> {
  await leccionAccesible(a, leccionId);
  const filas = await prisma.preguntaLeccion.findMany({
    where: { leccionId, segundoVideo: tipo === "checkpoint" ? { not: null } : null },
    orderBy: [{ segundoVideo: "asc" }, { orden: "asc" }],
    select: { id: true, orden: true, segundoVideo: true, enunciado: true, opciones: true },
  });
  return filas.map((p) => ({ id: p.id, orden: p.orden, segundoVideo: p.segundoVideo, enunciado: p.enunciado, opciones: aOpciones(p.opciones) }));
}

/** Para el editor del padre: con la respuesta correcta y la explicación */
export async function preguntasCompletas(a: Actor, leccionId: number) {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden ver las respuestas");
  await leccionAccesible(a, leccionId);
  const filas = await prisma.preguntaLeccion.findMany({ where: { leccionId }, orderBy: [{ segundoVideo: { sort: "asc", nulls: "last" } }, { orden: "asc" }] });
  return filas.map((p) => ({ id: p.id, orden: p.orden, segundoVideo: p.segundoVideo, enunciado: p.enunciado, opciones: aOpciones(p.opciones), correcta: p.correcta, explicacion: p.explicacion }));
}

/** Reemplaza todas las preguntas de la lección (PUT del editor) */
export async function guardarPreguntas(a: Actor, leccionId: number, preguntas: PreguntaEditable[]) {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden editar las preguntas");
  const errores = validarPreguntas(preguntas);
  if (errores.length) throw new DatoInvalidoError(errores[0]);
  await leccionAccesible(a, leccionId);
  await prisma.$transaction([
    prisma.preguntaLeccion.deleteMany({ where: { leccionId } }),
    prisma.preguntaLeccion.createMany({
      data: preguntas.map((p, i) => ({
        leccionId,
        orden: i + 1,
        segundoVideo: p.segundoVideo ?? null,
        enunciado: p.enunciado.trim(),
        opciones: p.opciones.map((o) => o.trim()),
        correcta: p.correcta,
        explicacion: p.explicacion?.trim() || null,
      })),
    }),
  ]);
  return { ok: true, total: preguntas.length };
}

export async function responderCheckpoint(a: Actor, leccionId: number, preguntaId: number, elegida: number) {
  await leccionAccesible(a, leccionId);
  const p = await prisma.preguntaLeccion.findFirst({ where: { id: preguntaId, leccionId, segundoVideo: { not: null } } });
  if (!p) throw new NoEncontradoError("Pregunta no encontrada");
  const correcta = elegida === p.correcta;
  return { correcta, explicacion: p.explicacion };
}

export async function fallosSeguidos(alumnoId: number, leccionId: number): Promise<number> {
  const intentos = await prisma.intentoQuiz.findMany({ where: { alumnoId, leccionId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { aprobado: true } });
  return fallosSeguidosDe(intentos);
}

/** Crea (o reinicia, si ya estaba resuelta) la tarjeta de repaso de una lección */
export async function crearTarjeta(alumnoId: number, leccionId: number, ahora = new Date()) {
  const existente = await prisma.tarjetaRepaso.findUnique({ where: { alumnoId_leccionId: { alumnoId, leccionId } } });
  if (existente && !existente.resuelta) return existente;
  const { tarjeta, proximo } = nuevaTarjeta(ahora);
  const datos = { tarjeta: JSON.parse(JSON.stringify(tarjeta)), proximo, resuelta: false };
  return existente
    ? prisma.tarjetaRepaso.update({ where: { id: existente.id }, data: datos })
    : prisma.tarjetaRepaso.create({ data: { alumnoId, leccionId, ...datos } });
}

export async function calificarFinal(a: Actor, leccionId: number, respuestas: Record<number, number>, hoy = hoyEnFamilia()) {
  const leccion = await leccionAccesible(a, leccionId);
  if (esPadre(a.rol)) throw new NoAutorizadoError("El quiz lo responde el alumno");
  const preguntas = await prisma.preguntaLeccion.findMany({ where: { leccionId, segundoVideo: null }, orderBy: { orden: "asc" } });
  if (preguntas.length === 0) throw new DatoInvalidoError("Esta lección no tiene quiz");

  const nota = calcularNota(preguntas, respuestas);
  const aprobado = nota >= leccion.recurso.umbralAprobacion;

  // Si aprueba, la lección se completa primero: si está bloqueada o no es de hoy, no se guarda un intento "aprobado" inútil
  const progreso = aprobado ? await completarLeccion(a.id, leccionId, hoy, { quizAprobado: true }) : null;
  await prisma.intentoQuiz.create({ data: { alumnoId: a.id, leccionId, nota, aprobado, respuestas } });

  const fallos = aprobado ? 0 : await fallosSeguidos(a.id, leccionId);
  if (fallos >= 2) await crearTarjeta(a.id, leccionId);

  return {
    nota,
    aprobado,
    umbral: leccion.recurso.umbralAprobacion,
    // Recién ahora se informa cada acierto y su explicación (nunca el índice correcto)
    detalle: preguntas.map((p) => ({ preguntaId: p.id, acierto: respuestas[p.id] === p.correcta, explicacion: p.explicacion })),
    fallosSeguidos: fallos,
    ultimaDelDia: progreso?.ultimaDelDia ?? false,
    tareaId: progreso?.tareaId ?? null,
  };
}

/** Avisos para el padre: «Leo: 50 % en Fracciones — requiere repaso» (tarjetas de repaso sin resolver) */
export async function avisosParaPadre(a: Actor) {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden ver los avisos");
  const tarjetas = await prisma.tarjetaRepaso.findMany({
    where: { resuelta: false },
    include: { alumno: { select: { nombre: true } }, leccion: { select: { titulo: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const avisos = [];
  for (const t of tarjetas) {
    const ultimo = await prisma.intentoQuiz.findFirst({ where: { alumnoId: t.alumnoId, leccionId: t.leccionId }, orderBy: { createdAt: "desc" }, select: { nota: true } });
    avisos.push({ tarjetaId: t.id, texto: `${t.alumno.nombre}: ${ultimo ? `${ultimo.nota} % en ` : ""}${t.leccion.titulo} — requiere repaso` });
  }
  return avisos;
}

