// Propio de Ordo (lane 185, D10): resumen de la semana para los padres — por cada hijo, lo que hizo de lunes a hoy: días de clase,
// horas, notas, lectura, recitados y trabajos enviados. Solo lectura sobre lo que ya hay en la app. Solo padres.
import prisma from "../../prisma.ts";
import { aClave, aFecha, hoyEnFamilia, NoAutorizadoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { promedio } from "../calificaciones.ts";
import { estadoSincronizado } from "../dia.ts";
import { lunesDe, sumarDias } from "../semana.ts";
import type { Actor } from "./materiales.ts";

export type ResumenHijo = {
  id: number;
  nombre: string;
  fotoUrl: string | null;
  dias: { planeados: number; hechos: number };
  minutos: number;
  notas: { cantidad: number; promedio: number | null };
  paginas: number;
  librosTerminados: number;
  recitados: number;
  trabajos: number;
};
export type ResumenSemanal = { desde: string; hasta: string; hijos: ResumenHijo[] };

export async function resumenSemanal(a: Actor, hoy = hoyEnFamilia()): Promise<ResumenSemanal> {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
  const desde = lunesDe(hoy);
  const rango = { gte: aFecha(desde), lte: aFecha(hoy) };
  const hijos = await prisma.usuario.findMany({ where: { rolFamiliar: { in: ["Hijo", "Hija"] } }, select: { id: true, nombre: true, fotoUrl: true }, orderBy: { nombre: "asc" } });
  if (hijos.length === 0) return { desde, hasta: hoy, hijos: [] };
  const ids = hijos.map((h) => h.id);
  const finDia = new Date(aFecha(sumarDias(hoy, 1)).getTime());

  const [dias, notas, sesiones, libros, memoria, trabajos] = await Promise.all([
    prisma.diaLectivo.findMany({
      where: { fecha: rango, estado: { in: ["pendiente", "hecha"] }, plan: { alumnoId: { in: ids } } },
      select: { fecha: true, estado: true, unidadDesde: true, unidadHasta: true, tarea: { select: { estado: true } }, plan: { select: { alumnoId: true, recurso: { select: { minutosPorUnidad: true } } } } },
    }),
    prisma.calificacion.findMany({ where: { alumnoId: { in: ids }, fecha: rango }, select: { alumnoId: true, puntaje: true } }),
    prisma.sesionLectura.groupBy({ by: ["alumnoId"], where: { alumnoId: { in: ids }, fecha: rango }, _sum: { paginas: true } }),
    prisma.lecturaLibro.groupBy({ by: ["alumnoId"], where: { alumnoId: { in: ids }, estado: "leido", terminadoEn: rango }, _count: { _all: true } }),
    prisma.memorizacion.groupBy({ by: ["alumnoId"], where: { alumnoId: { in: ids }, ultimoEn: { gte: aFecha(desde), lt: finDia } }, _count: { _all: true } }),
    prisma.evidenciaAprendizaje.groupBy({ by: ["alumnoId"], where: { alumnoId: { in: ids }, createdAt: { gte: aFecha(desde), lt: finDia } }, _count: { _all: true } }),
  ]);

  return {
    desde,
    hasta: aClave(aFecha(hoy)),
    hijos: hijos.map((h) => {
      const suyos = dias.filter((d) => d.plan.alumnoId === h.id);
      const hechos = suyos.filter((d) => estadoSincronizado(d.estado, d.tarea?.estado ?? null) === "hecha");
      const puntajes = notas.filter((n) => n.alumnoId === h.id).map((n) => n.puntaje);
      return {
        id: h.id,
        nombre: h.nombre,
        fotoUrl: h.fotoUrl,
        dias: { planeados: suyos.length, hechos: hechos.length },
        minutos: hechos.reduce((n, d) => n + (d.unidadHasta - d.unidadDesde + 1) * d.plan.recurso.minutosPorUnidad, 0),
        notas: { cantidad: puntajes.length, promedio: promedio(puntajes) },
        paginas: sesiones.find((s) => s.alumnoId === h.id)?._sum.paginas ?? 0,
        librosTerminados: libros.find((l) => l.alumnoId === h.id)?._count._all ?? 0,
        recitados: memoria.find((m) => m.alumnoId === h.id)?._count._all ?? 0,
        trabajos: trabajos.find((t) => t.alumnoId === h.id)?._count._all ?? 0,
      };
    }),
  };
}
