// Portado de vendor/roost/src/services/event.ts y vendor/roost/src/db/adapters/mongodb/index.ts (msrbuilds/roost@492af47).
// Cambios: Prisma en vez de Supabase, participantes en lugar de RSVP, permisos por rol familiar en vez de RLS.
// Actividades fuera de pantalla (el «event» de Roost sin RSVP, sin virtual y sin URL de reunión). Solo Padre/Madre
// crean, editan y borran; un Hijo ve únicamente las suyas. `fin > inicio` (en Roost era un CHECK) se valida acá.
import { addDays, format, parseISO } from "date-fns";
import prisma from "../../prisma.ts";
import type { Prisma } from "@prisma/client";
import { NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { inicioDelDia } from "../dia.ts";
import { mapEvent } from "../roost/dto.ts";
import type { EventWithDetails } from "../roost/tipos.ts";
import { DatoInvalidoError } from "./planes.ts";

export type Actor = { id: number; rol: string };

const INCLUIR = {
  materia: { select: { nombre: true } },
  participantes: { include: { alumno: { select: { id: true, nombre: true, fotoUrl: true } } } },
} as const;

const exigirPadre = (a: Actor) => {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
};

export type DatosActividad = { materiaId: number; titulo: string; descripcion?: string | null; inicio: Date; fin: Date; lugar?: string | null; alumnoIds: number[] };

function validar(d: Pick<DatosActividad, "titulo" | "inicio" | "fin" | "alumnoIds">) {
  if (!d.titulo.trim()) throw new DatoInvalidoError("Falta el título de la actividad");
  if (Number.isNaN(d.inicio.getTime()) || Number.isNaN(d.fin.getTime())) throw new DatoInvalidoError("Las fechas no son válidas");
  if (d.fin <= d.inicio) throw new DatoInvalidoError("El fin tiene que ser posterior al inicio");
  if (new Set(d.alumnoIds).size === 0) throw new DatoInvalidoError("Elegí al menos un alumno");
}

async function exigirAlumnos(db: Prisma.TransactionClient | typeof prisma, ids: number[]) {
  const existentes = await db.usuario.count({ where: { id: { in: ids } } });
  if (existentes !== new Set(ids).size) throw new NoEncontradoError("Algún alumno no existe");
}

/** Actividades entre dos fechas ('YYYY-MM-DD' inclusive). El padre ve todas; un Hijo, las suyas. */
export async function listarActividades(a: Actor, f: { desde?: string; hasta?: string } = {}): Promise<EventWithDetails[]> {
  const where: Prisma.ActividadOfflineWhereInput = esPadre(a.rol) ? {} : { participantes: { some: { alumnoId: a.id } } };
  if (f.desde || f.hasta) {
    where.inicio = {
      ...(f.desde && { gte: inicioDelDia(f.desde) }),
      ...(f.hasta && { lt: inicioDelDia(format(addDays(parseISO(f.hasta), 1), "yyyy-MM-dd")) }),
    };
  }
  const filas = await prisma.actividadOffline.findMany({ where, include: INCLUIR, orderBy: { inicio: "desc" }, take: 300 });
  return filas.map(mapEvent);
}

export async function crearActividad(a: Actor, d: DatosActividad): Promise<EventWithDetails> {
  exigirPadre(a);
  validar(d);
  const alumnoIds = [...new Set(d.alumnoIds)];
  return prisma.$transaction(async (tx) => {
    if (!(await tx.materia.findUnique({ where: { id: d.materiaId }, select: { id: true } }))) throw new NoEncontradoError("Materia no encontrada");
    await exigirAlumnos(tx, alumnoIds);
    const act = await tx.actividadOffline.create({
      data: {
        materiaId: d.materiaId,
        titulo: d.titulo.trim(),
        descripcion: d.descripcion?.trim() || null,
        inicio: d.inicio,
        fin: d.fin,
        lugar: d.lugar?.trim() || null,
        creadorId: a.id,
        participantes: { create: alumnoIds.map((alumnoId) => ({ alumnoId })) },
      },
      include: INCLUIR,
    });
    return mapEvent(act);
  });
}

export async function editarActividad(a: Actor, id: number, d: DatosActividad): Promise<EventWithDetails> {
  exigirPadre(a);
  validar(d);
  const alumnoIds = [...new Set(d.alumnoIds)];
  return prisma.$transaction(async (tx) => {
    if (!(await tx.actividadOffline.findUnique({ where: { id }, select: { id: true } }))) throw new NoEncontradoError("Actividad no encontrada");
    await exigirAlumnos(tx, alumnoIds);
    await tx.participanteActividad.deleteMany({ where: { actividadId: id } });
    const act = await tx.actividadOffline.update({
      where: { id },
      data: {
        materiaId: d.materiaId,
        titulo: d.titulo.trim(),
        descripcion: d.descripcion?.trim() || null,
        inicio: d.inicio,
        fin: d.fin,
        lugar: d.lugar?.trim() || null,
        participantes: { create: alumnoIds.map((alumnoId) => ({ alumnoId })) },
      },
      include: INCLUIR,
    });
    return mapEvent(act);
  });
}

export async function borrarActividad(a: Actor, id: number) {
  exigirPadre(a);
  const r = await prisma.actividadOffline.deleteMany({ where: { id } });
  if (r.count === 0) throw new NoEncontradoError("Actividad no encontrada");
}

/** getEventAttendees de Roost: quiénes participaron */
export async function participantesDe(a: Actor, id: number) {
  const act = await prisma.actividadOffline.findUnique({ where: { id }, include: INCLUIR });
  if (!act) throw new NoEncontradoError("Actividad no encontrada");
  if (!esPadre(a.rol) && !act.participantes.some((p) => p.alumno.id === a.id)) throw new NoAutorizadoError("Esa actividad no es tuya");
  return mapEvent(act).participantes;
}
