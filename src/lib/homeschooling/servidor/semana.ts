// Propio de Ordo (lane 173, P2): la semana de un hijo lista para imprimir — qué le toca cada día (curso, páginas o lecciones,
// minutos), el material que dejó el padre, las actividades y los días sin clase. Solo padres. Es la hoja que se pega en la
// heladera: lectura real, lápiz y cuaderno, sin pantalla.
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import prisma from "../../prisma.ts";
import { aClave, aFecha, APP_TZ, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { rangoTexto } from "../dia.ts";
import { diasDeSemana, etiquetaDia, sumarDias } from "../semana.ts";
import { TIPOS_CON_LECCIONES } from "./progreso.ts";
import type { Actor } from "./cursos.ts";

export type ItemSemana = {
  materia: string;
  color: string | null;
  curso: string;
  rango: string;
  minutos: number;
  hecho: boolean;
  lecciones: { orden: number; titulo: string }[];
  material: string[];
};
export type DiaSemana = { fecha: string; etiqueta: string; sinClase: string | null; items: ItemSemana[]; sueltos: string[]; actividades: { titulo: string; hora: string; lugar: string | null }[] };
export type HojaSemana = { alumno: { id: number; nombre: string }; desde: string; hasta: string; anterior: string; siguiente: string; dias: DiaSemana[]; minutosTotales: number };

const hora = (d: Date) => new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", timeZone: APP_TZ }).format(d);
/** Día de la familia (zona horaria de la casa) en que cae un instante */
const claveEnFamilia = (d: Date) => format(d, "yyyy-MM-dd", { in: tz(APP_TZ) });

export async function hojaSemana(a: Actor, alumnoId: number, lunes: string): Promise<HojaSemana> {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
  const alumno = await prisma.usuario.findUnique({ where: { id: alumnoId }, select: { id: true, nombre: true, rolFamiliar: true } });
  if (!alumno || (alumno.rolFamiliar !== "Hijo" && alumno.rolFamiliar !== "Hija")) throw new NoEncontradoError("Alumno no encontrado");
  const fechas = diasDeSemana(lunes);
  const desde = fechas[0];
  const hasta = fechas[6];
  const rango = { gte: aFecha(desde), lte: aFecha(hasta) };

  const [dias, noLectivos, sueltos, actividades] = await Promise.all([
    prisma.diaLectivo.findMany({
      where: { fecha: rango, estado: { in: ["pendiente", "hecha"] }, plan: { alumnoId, estado: "activo" } },
      orderBy: [{ fecha: "asc" }, { id: "asc" }],
      include: {
        tarea: { select: { estado: true } },
        materiales: { orderBy: [{ orden: "asc" }, { id: "asc" }], select: { titulo: true } },
        plan: { select: { recurso: { select: { id: true, titulo: true, tipo: true, unidadTipo: true, minutosPorUnidad: true, materia: { select: { nombre: true, color: true } }, lecciones: { select: { orden: true, titulo: true, materiales: { select: { titulo: true }, orderBy: { orden: "asc" } } }, orderBy: { orden: "asc" } } } } } },
      },
    }),
    prisma.diaNoLectivo.findMany({ where: { alumnoId, fecha: rango }, select: { fecha: true, motivo: true } }),
    prisma.materialEstudio.findMany({ where: { alumnoId, fecha: rango }, orderBy: [{ orden: "asc" }, { id: "asc" }], select: { fecha: true, titulo: true } }),
    prisma.actividadOffline.findMany({ where: { inicio: { gte: aFecha(sumarDias(desde, -1)), lt: aFecha(sumarDias(hasta, 2)) }, participantes: { some: { alumnoId } } }, orderBy: { inicio: "asc" }, select: { titulo: true, inicio: true, lugar: true } }),
  ]);

  let minutosTotales = 0;
  const salida: DiaSemana[] = fechas.map((fecha) => {
    const delDia = dias.filter((d) => aClave(d.fecha) === fecha);
    const items: ItemSemana[] = delDia.map((d) => {
      const r = d.plan.recurso;
      const conLecciones = TIPOS_CON_LECCIONES.includes(r.tipo);
      const lecciones = conLecciones ? r.lecciones.filter((l) => l.orden >= d.unidadDesde && l.orden <= d.unidadHasta) : [];
      const minutos = (d.unidadHasta - d.unidadDesde + 1) * r.minutosPorUnidad;
      minutosTotales += minutos;
      return {
        materia: r.materia.nombre,
        color: r.materia.color,
        curso: r.titulo,
        rango: rangoTexto(r.unidadTipo, d.unidadDesde, d.unidadHasta),
        minutos,
        hecho: d.estado === "hecha" || ["Completada", "Esperando_Aprobacion", "Aprobada"].includes(d.tarea?.estado ?? ""),
        lecciones: lecciones.map((l) => ({ orden: l.orden, titulo: l.titulo })),
        material: [...d.materiales.map((m) => m.titulo), ...lecciones.flatMap((l) => l.materiales.map((m) => m.titulo))],
      };
    });
    return {
      fecha,
      etiqueta: etiquetaDia(fecha),
      sinClase: noLectivos.find((n) => aClave(n.fecha) === fecha)?.motivo ?? null,
      items,
      sueltos: sueltos.filter((s) => s.fecha && aClave(s.fecha) === fecha).map((s) => s.titulo),
      actividades: actividades.filter((x) => claveEnFamilia(x.inicio) === fecha).map((x) => ({ titulo: x.titulo, hora: hora(x.inicio), lugar: x.lugar })),
    };
  });
  return { alumno: { id: alumno.id, nombre: alumno.nombre }, desde, hasta, anterior: sumarDias(desde, -7), siguiente: sumarDias(desde, 7), dias: salida, minutosTotales };
}
