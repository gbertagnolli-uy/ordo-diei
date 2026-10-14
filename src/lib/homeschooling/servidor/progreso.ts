// Progreso de lecciones y estado de los días (ARQUITECTURA_DETALLADA §5.3 y §5.4). Portado de `markLessonComplete`
// de vendor/roost/src/services/module.ts con el upsert idempotente de `completelesson`
// (vendor/roost/src/db/adapters/mongodb/index.ts:2528): el par (alumno, lección) es único.
import prisma from "../../prisma.ts";
import type { Prisma } from "@prisma/client";
import { aClave, hoyEnFamilia, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { estaBloqueado, estadoSincronizado, motivoLeccionBloqueada, unidadSatisfecha } from "../dia.ts";
import { ConflictoError } from "./planes.ts";
import { crearTareaDelDia } from "./tareas.ts";

type Db = Prisma.TransactionClient | typeof prisma;

export const TIPOS_CON_LECCIONES = ["curso_videos", "enlaces"];

/** Pasa a `hecha`/`pendiente` los días cuya Tarea cambió (§5.3). Devuelve los estados nuevos por id. */
export async function sincronizarDias(
  db: Db,
  dias: { id: number; estado: string; tarea: { estado: string } | null }[]
): Promise<Map<number, string>> {
  const nuevos = new Map<number, string>();
  const aHecha: number[] = [];
  const aPendiente: number[] = [];
  for (const d of dias) {
    const e = estadoSincronizado(d.estado, d.tarea?.estado ?? null);
    nuevos.set(d.id, e);
    if (e !== d.estado) (e === "hecha" ? aHecha : aPendiente).push(d.id);
  }
  if (aHecha.length) await db.diaLectivo.updateMany({ where: { id: { in: aHecha } }, data: { estado: "hecha" } });
  if (aPendiente.length) await db.diaLectivo.updateMany({ where: { id: { in: aPendiente } }, data: { estado: "pendiente" } });
  return nuevos;
}

/** Unidades que ya están vistas: con ProgresoLeccion propio o cubiertas por un día hecho/omitido */
export async function unidadesVistas(db: Db, alumnoId: number, recursoId: number) {
  const [progreso, dias] = await Promise.all([
    db.progresoLeccion.findMany({ where: { alumnoId, recursoId }, select: { leccion: { select: { orden: true } } } }),
    db.diaLectivo.findMany({
      where: { plan: { alumnoId, recursoId }, estado: { in: ["hecha", "omitida"] } },
      select: { unidadDesde: true, unidadHasta: true },
    }),
  ]);
  const conProgreso = new Set(progreso.map((p) => p.leccion.orden));
  const cubiertas = new Set<number>();
  for (const d of dias) for (let u = d.unidadDesde; u <= d.unidadHasta; u++) cubiertas.add(u);
  return { conProgreso, cubiertas, satisfecha: (u: number) => unidadSatisfecha(u, conProgreso, cubiertas) };
}

/**
 * Marca una lección como terminada por el alumno. Solo vale si la lección es del día de hoy (o adelantable con navegación
 * libre) y no está bloqueada por la anterior. No da puntos: los premios salen de la Tarea del día.
 * Devuelve `ultimaDelDia` y la `tareaId` que hay que completar con `POST /api/tasks/[id]/complete`.
 */
export async function completarLeccion(alumnoId: number, leccionId: number, hoy = hoyEnFamilia()) {
  return prisma.$transaction(async (tx) => {
    const leccion = await tx.leccionCurso.findUnique({ where: { id: leccionId }, include: { recurso: true } });
    if (!leccion) throw new NoEncontradoError("Lección no encontrada");
    const plan = await tx.planCurso.findFirst({ where: { alumnoId, recursoId: leccion.recursoId, estado: "activo" } });
    if (!plan) throw new NoAutorizadoError("Esta lección no es tuya");

    const dias = await tx.diaLectivo.findMany({ where: { planId: plan.id, estado: { in: ["pendiente", "hecha"] } }, orderBy: { fecha: "asc" }, include: { tarea: { select: { estado: true } } } });
    const idx = dias.findIndex((d) => d.unidadDesde <= leccion.orden && leccion.orden <= d.unidadHasta);
    const dia = dias[idx];
    if (!dia) throw new ConflictoError("Esa lección no está en tu plan de hoy");
    const todos = await tx.diaLectivo.findMany({ where: { planId: plan.id }, orderBy: { fecha: "asc" }, select: { fecha: true, estado: true } });
    const anterior = [...todos].reverse().find((d) => d.fecha < dia.fecha && d.estado !== "movida");
    if (estaBloqueado({ fecha: aClave(dia.fecha), hoy, navegacionLibre: leccion.recurso.navegacionLibre, anteriorEstado: anterior?.estado ?? null })) {
      throw new ConflictoError("Ese día todavía no está disponible");
    }

    if (TIPOS_CON_LECCIONES.includes(leccion.recurso.tipo) && leccion.orden > 1) {
      const vistas = await unidadesVistas(tx, alumnoId, leccion.recursoId);
      const previa = await tx.leccionCurso.findFirst({ where: { recursoId: leccion.recursoId, orden: leccion.orden - 1 }, select: { titulo: true } });
      const motivo = motivoLeccionBloqueada(leccion.orden, previa?.titulo, vistas.satisfecha);
      if (motivo) throw new ConflictoError(motivo);
    }
    // H4: si la lección tiene preguntas, acá se exige el quiz aprobado antes de crear el progreso.

    await tx.progresoLeccion.upsert({
      where: { alumnoId_leccionId: { alumnoId, leccionId } },
      create: { alumnoId, leccionId, recursoId: leccion.recursoId },
      update: {},
    });

    const delRango = await tx.leccionCurso.findMany({
      where: { recursoId: leccion.recursoId, orden: { gte: dia.unidadDesde, lte: dia.unidadHasta } },
      select: { id: true },
    });
    const hechas = await tx.progresoLeccion.count({ where: { alumnoId, leccionId: { in: delRango.map((l) => l.id) } } });
    const ultimaDelDia = hechas >= delRango.length;

    let tareaId = dia.tareaId;
    if (ultimaDelDia && !tareaId) tareaId = (await crearTareaDelDia(tx, dia.id)) ?? null;
    return { ultimaDelDia, tareaId, diaId: dia.id };
  });
}

/** Solo Padre/Madre: desmarca una lección (borra el progreso). Si el día ya estaba `hecha`, la Tarea no cambia. */
export async function desmarcarLeccion(actor: { id: number; rol: string }, alumnoId: number, leccionId: number) {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden desmarcar una lección");
  await prisma.progresoLeccion.deleteMany({ where: { alumnoId, leccionId } });
  return { ok: true };
}


/**
 * Tarea de un día para el alumno (días sin lecciones: libro, PDF…). Hoy ya la crea `asegurarTareasDeHoy`; esto cubre un día
 * adelantable (navegación libre) que todavía no tiene. Devuelve la `tareaId`.
 */
export async function tareaDelDiaAlumno(alumnoId: number, diaId: number, hoy = hoyEnFamilia()) {
  const dia = await prisma.diaLectivo.findUnique({ where: { id: diaId }, include: { plan: { include: { recurso: true } } } });
  if (!dia || dia.plan.alumnoId !== alumnoId) throw new NoAutorizadoError("Ese día no es tuyo");
  if (dia.estado !== "pendiente" && dia.estado !== "hecha") throw new ConflictoError("Ese día ya no está disponible");
  const otros = await prisma.diaLectivo.findMany({ where: { planId: dia.planId, estado: { not: "movida" } }, orderBy: { fecha: "asc" }, select: { fecha: true, estado: true } });
  const anterior = [...otros].reverse().find((d) => d.fecha < dia.fecha);
  if (estaBloqueado({ fecha: aClave(dia.fecha), hoy, navegacionLibre: dia.plan.recurso.navegacionLibre, anteriorEstado: anterior?.estado ?? null })) {
    throw new ConflictoError("Ese día todavía no está disponible");
  }
  return { tareaId: await crearTareaDelDia(prisma, dia.id) };
}
