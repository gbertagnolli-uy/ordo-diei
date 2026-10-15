// Propio de Ordo (lane 179, R4): calendario del alumno para suscribirse desde Google/Apple Calendar. El enlace lleva una firma
// (HMAC del id con el secreto de la casa) en vez de pedir sesión, porque los calendarios externos no pueden iniciarla. Quien
// tiene el enlace ve solo los títulos de las clases de ese hijo; cambiar SESSION_SECRET invalida todos los enlaces.
import { createHmac, timingSafeEqual } from "node:crypto";
import prisma from "../../prisma.ts";
import { aClave, aFecha } from "../../habitos/server.ts";
import { rangoTexto } from "../dia.ts";
import { sumarDias } from "../semana.ts";
import type { EventoIcs } from "../ics.ts";

const secreto = () => process.env.SESSION_SECRET || "secreto_super_seguro_family_tasker";

export function tokenDeCalendario(alumnoId: number): string {
  return createHmac("sha256", secreto()).update(`ics:${alumnoId}`).digest("hex").slice(0, 32);
}

export function tokenValido(alumnoId: number, token: string): boolean {
  const limpio = token.replace(/\.ics$/i, "");
  const esperado = tokenDeCalendario(alumnoId);
  if (limpio.length !== esperado.length) return false;
  return timingSafeEqual(Buffer.from(limpio), Buffer.from(esperado));
}

/** Clases, actividades y días sin clase desde hace 14 días hasta 180 días adelante */
export async function eventosDelAlumno(alumnoId: number, hoy: string): Promise<{ nombre: string; eventos: EventoIcs[] } | null> {
  const alumno = await prisma.usuario.findUnique({ where: { id: alumnoId }, select: { nombre: true, rolFamiliar: true } });
  if (!alumno || (alumno.rolFamiliar !== "Hijo" && alumno.rolFamiliar !== "Hija")) return null;
  const desde = sumarDias(hoy, -14);
  const hasta = sumarDias(hoy, 180);
  const rango = { gte: aFecha(desde), lte: aFecha(hasta) };
  const [dias, noLectivos, actividades] = await Promise.all([
    prisma.diaLectivo.findMany({
      where: { fecha: rango, estado: { in: ["pendiente", "hecha"] }, plan: { alumnoId, estado: "activo" } },
      select: { id: true, fecha: true, unidadDesde: true, unidadHasta: true, plan: { select: { recurso: { select: { titulo: true, unidadTipo: true, minutosPorUnidad: true, materia: { select: { nombre: true } } } } } } },
    }),
    prisma.diaNoLectivo.findMany({ where: { alumnoId, fecha: rango }, select: { id: true, fecha: true, motivo: true } }),
    prisma.actividadOffline.findMany({ where: { inicio: { gte: aFecha(sumarDias(desde, -1)), lte: aFecha(sumarDias(hasta, 1)) }, participantes: { some: { alumnoId } } }, select: { id: true, titulo: true, descripcion: true, inicio: true, fin: true, lugar: true } }),
  ]);
  const eventos: EventoIcs[] = [
    ...dias.map((d) => {
      const r = d.plan.recurso;
      const min = (d.unidadHasta - d.unidadDesde + 1) * r.minutosPorUnidad;
      return { uid: `dia-${d.id}@ordodiei`, titulo: `${r.materia.nombre}: ${r.titulo} — ${rangoTexto(r.unidadTipo, d.unidadDesde, d.unidadHasta).toLowerCase()}`, descripcion: `Unos ${min} minutos`, dia: aClave(d.fecha) };
    }),
    ...noLectivos.map((n) => ({ uid: `sin-clase-${n.id}@ordodiei`, titulo: `Sin clase: ${n.motivo}`, dia: aClave(n.fecha) })),
    ...actividades.map((a) => ({ uid: `actividad-${a.id}@ordodiei`, titulo: a.titulo, descripcion: a.descripcion, lugar: a.lugar, inicio: a.inicio, fin: a.fin })),
  ];
  return { nombre: `Estudio de ${alumno.nombre}`, eventos };
}
