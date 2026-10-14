// Puente día lectivo → Tarea (ARQUITECTURA_DETALLADA §5.1 y §5.2): cada día lectivo se materializa como una Tarea real,
// así el niño la completa con `/api/tasks/[id]/complete` y el padre la aprueba con `/approve` (puntos, estrellas y racha
// ya existentes; sin código de premios nuevo).
import prisma from "../../prisma.ts";
import type { Prisma } from "@prisma/client";
import { aClave, aFecha, hoyEnFamilia } from "../../habitos/server.ts";
import { HORA_LIMITE_LECCION } from "../config.ts";
import { estimadoSegundos, inicioDelDia, tituloTarea, vencimientoLeccion } from "../dia.ts";
import { recalcular } from "./planes.ts";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Crea la Tarea de un día lectivo si no la tiene, sin carreras: se crea y se asigna con `updateMany` condicionado a
 * `tareaId: null`; si otra pestaña ganó, se borra la recién creada. Devuelve la `tareaId` vigente.
 */
export async function crearTareaDelDia(db: Db, diaId: number): Promise<number | null> {
  const dia = await db.diaLectivo.findUnique({
    where: { id: diaId },
    include: { plan: { include: { recurso: { include: { materia: true } } } } },
  });
  if (!dia) return null;
  if (dia.tareaId) return dia.tareaId;

  const { plan } = dia;
  const { recurso } = plan;
  const fecha = aClave(dia.fecha);
  const estimado = estimadoSegundos(dia.unidadDesde, dia.unidadHasta, recurso.minutosPorUnidad);

  const tarea = await db.tarea.create({
    data: {
      titulo: tituloTarea(recurso.materia.nombre, recurso.titulo, recurso.unidadTipo, dia.unidadDesde, dia.unidadHasta),
      creadorId: recurso.creadorId,
      asignadoId: plan.alumnoId,
      tiempoEjecucionEstimadoSeg: estimado,
      generaPuntosYRecompensa: true,
      dificultad: recurso.materia.dificultad,
      tipoRecurrencia: "Unica",
      fechaVencimiento: inicioDelDia(fecha),
      horaEjecucion: vencimientoLeccion(fecha, HORA_LIMITE_LECCION, estimado),
    },
  });
  const ganada = await db.diaLectivo.updateMany({ where: { id: diaId, tareaId: null }, data: { tareaId: tarea.id } });
  if (ganada.count === 0) {
    await db.tarea.delete({ where: { id: tarea.id } });
    return (await db.diaLectivo.findUnique({ where: { id: diaId }, select: { tareaId: true } }))?.tareaId ?? null;
  }
  return tarea.id;
}

/**
 * Idempotente. Se llama al abrir «Hoy aprendo» y desde el cron diario: reprograma los atrasos de cada plan activo y crea
 * la Tarea de los días de hoy que no la tengan. Devuelve cuántas Tareas creó.
 */
export async function asegurarTareasDeHoy(alumnoId: number, hoy = hoyEnFamilia()): Promise<number> {
  const planes = await prisma.planCurso.findMany({ where: { alumnoId, estado: "activo" }, include: { dias: { select: { fecha: true, estado: true } } } });
  for (const p of planes) {
    if (p.dias.some((d) => d.estado === "pendiente" && aClave(d.fecha) < hoy)) await recalcular(p.id, hoy);
  }

  const dias = await prisma.diaLectivo.findMany({
    where: { plan: { alumnoId, estado: "activo" }, fecha: aFecha(hoy), estado: "pendiente", tareaId: null },
    select: { id: true },
  });
  let creadas = 0;
  for (const d of dias) {
    const antes = await prisma.diaLectivo.findUnique({ where: { id: d.id }, select: { tareaId: true } });
    if (antes?.tareaId) continue;
    if (await crearTareaDelDia(prisma, d.id)) creadas++;
  }
  return creadas;
}

/** Alumnos con algún plan activo (para el cron) */
export async function alumnosConPlanActivo(): Promise<number[]> {
  const filas = await prisma.planCurso.findMany({ where: { estado: "activo" }, select: { alumnoId: true }, distinct: ["alumnoId"] });
  return filas.map((f) => f.alumnoId);
}
