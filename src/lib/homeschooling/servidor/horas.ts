// Resumen de horas de un alumno (arma la entrada de `sumarHoras` con una consulta por tipo) y metas de horas.
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import prisma from "../../prisma.ts";
import { aClave, aFecha, NoAutorizadoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { TZ_FAMILIA } from "../dia.ts";
import { sumarHoras, type ActividadParaHoras, type DiaParaHoras } from "../horas.ts";
import { DatoInvalidoError } from "./planes.ts";

export type Actor = { id: number; rol: string };

const fechaLocal = (d: Date) => format(new TZDate(d, TZ_FAMILIA), "yyyy-MM-dd");
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function resumenHoras(a: Actor, p: { alumnoId: number; desde: string; hasta: string }) {
  const alumnoId = esPadre(a.rol) ? p.alumnoId : a.id;
  if (!FECHA.test(p.desde) || !FECHA.test(p.hasta) || p.desde > p.hasta) throw new DatoInvalidoError("El período no es válido");

  const [alumno, dias, actividades, intentos, metas, planes, evidencias] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: alumnoId }, select: { id: true, nombre: true } }),
    prisma.diaLectivo.findMany({
      where: { plan: { alumnoId }, fecha: { gte: aFecha(p.desde), lte: aFecha(p.hasta) } },
      include: { tarea: { select: { tiempoRealEjecucionSeg: true } }, plan: { include: { recurso: { select: { minutosPorUnidad: true, materia: { select: { id: true, nombre: true } } } } } } },
    }),
    // Un día de margen a cada lado: el día de una actividad se decide con la zona de la familia
    prisma.actividadOffline.findMany({
      where: { participantes: { some: { alumnoId } }, inicio: { gte: new Date(aFecha(p.desde).getTime() - 864e5), lte: new Date(aFecha(p.hasta).getTime() + 2 * 864e5) } },
      include: { materia: { select: { id: true, nombre: true } }, participantes: { select: { alumnoId: true } } },
    }),
    prisma.intentoQuiz.findMany({
      where: { alumnoId, aprobado: true, createdAt: { gte: aFecha(p.desde), lt: new Date(aFecha(p.hasta).getTime() + 864e5) } },
      select: { nota: true, leccion: { select: { recurso: { select: { materiaId: true } } } } },
    }),
    prisma.metaHoras.findMany({ where: { alumnoId } }),
    prisma.planCurso.findMany({
      where: { alumnoId, estado: "activo" },
      include: { recurso: { select: { titulo: true, totalUnidades: true, materia: { select: { nombre: true } } } }, dias: { select: { estado: true, unidadDesde: true, unidadHasta: true } } },
    }),
    prisma.evidenciaAprendizaje.findMany({
      where: { alumnoId, destacada: true, estado: "aprobada", createdAt: { gte: aFecha(p.desde), lt: new Date(aFecha(p.hasta).getTime() + 864e5) } },
      include: { imagenes: { orderBy: { orden: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  if (!alumno) throw new NoAutorizadoError("Alumno no encontrado");

  const diasHoras: DiaParaHoras[] = dias.map((d) => ({
    fecha: aClave(d.fecha),
    estado: d.estado,
    unidadDesde: d.unidadDesde,
    unidadHasta: d.unidadHasta,
    minutosPorUnidad: d.plan.recurso.minutosPorUnidad,
    tiempoRealSeg: d.tarea?.tiempoRealEjecucionSeg ?? null,
    materiaId: d.plan.recurso.materia.id,
    materiaNombre: d.plan.recurso.materia.nombre,
  }));
  const actividadesHoras: ActividadParaHoras[] = actividades.map((x) => ({
    fecha: fechaLocal(x.inicio),
    inicio: x.inicio,
    fin: x.fin,
    materiaId: x.materia.id,
    materiaNombre: x.materia.nombre,
    participantes: x.participantes.map((q) => q.alumnoId),
  }));

  const resumen = sumarHoras({
    alumnoId,
    desde: p.desde,
    hasta: p.hasta,
    dias: diasHoras,
    actividades: actividadesHoras,
    notas: intentos.map((i) => ({ materiaId: i.leccion.recurso.materiaId, nota: i.nota })),
  });

  return {
    alumno,
    desde: p.desde,
    hasta: p.hasta,
    ...resumen,
    metas: metas.map((m) => ({ materiaId: m.materiaId, horas: m.horas })),
    cursos: planes.map((pl) => {
      const hechas = pl.dias.filter((d) => d.estado === "hecha" || d.estado === "omitida").reduce((n, d) => n + d.unidadHasta - d.unidadDesde + 1, 0);
      return { titulo: pl.recurso.titulo, materia: pl.recurso.materia.nombre, porcentaje: pl.recurso.totalUnidades > 0 ? Math.min(100, Math.round((hechas / pl.recurso.totalUnidades) * 100)) : 0 };
    }),
    evidenciasDestacadas: evidencias.map((e) => ({ id: e.id, titulo: e.titulo, fecha: fechaLocal(e.createdAt), foto: e.imagenes[0]?.archivoUrl ?? null })),
  };
}

/** La fija el padre por alumno y materia; 0 la quita */
export async function fijarMeta(a: Actor, d: { alumnoId: number; materiaId: number; horas: number }) {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden fijar metas");
  if (!Number.isInteger(d.horas) || d.horas < 0 || d.horas > 2000) throw new DatoInvalidoError("Las horas no son válidas");
  if (d.horas === 0) {
    await prisma.metaHoras.deleteMany({ where: { alumnoId: d.alumnoId, materiaId: d.materiaId } });
    return { ok: true, horas: 0 };
  }
  await prisma.metaHoras.upsert({
    where: { alumnoId_materiaId: { alumnoId: d.alumnoId, materiaId: d.materiaId } },
    create: d,
    update: { horas: d.horas },
  });
  return { ok: true, horas: d.horas };
}
