// Decisión pura de `recalcular` (ARQUITECTURA_DETALLADA §4 regla 5): qué días se conservan, se mueven o se
// borran, y el reparto nuevo. La transacción de Prisma vive en servidor/planes.ts y solo aplica este resultado.
import { repartir, type SalidaPacing, type UnidadTipo } from "./pacing.ts";

export type EstadoDia = "pendiente" | "hecha" | "movida" | "omitida";

/** Tarea completada por el alumno (aunque el día aún no se haya sincronizado) */
export const ESTADOS_TAREA_HECHA = ["Completada", "Esperando_Aprobacion", "Aprobada"];

export type DiaPlan = {
  id: number;
  fecha: string;
  unidadDesde: number;
  unidadHasta: number;
  estado: EstadoDia;
  /** Estado de la Tarea del día, o null si no tiene */
  tareaEstado: string | null;
};

export type EntradaRecalculo = {
  dias: DiaPlan[];
  hoy: string;
  inicio: string;
  fin: string;
  diasSemana: number[];
  totalUnidades: number;
  unidadTipo: UnidadTipo;
  noLectivosAlumno: string[];
};

export type SalidaRecalculo = {
  /** Días que siguen como están */
  conservar: number[];
  /** Conservados que pasan a `hecha` porque su Tarea ya está completada */
  marcarHechas: number[];
  /** Días pasados sin hacer → `movida` */
  mover: number[];
  /** Días futuros sin empezar: se borran (y su Tarea si sigue `Pendiente`) */
  borrar: number[];
  base: number;
  /** Unidades < base que ningún día conservado cubre (no deberían existir) */
  huecos: number;
  pacing: SalidaPacing;
};

export function planearRecalculo(e: EntradaRecalculo): SalidaRecalculo {
  const conservar: number[] = [];
  const marcarHechas: number[] = [];
  const mover: number[] = [];
  const borrar: number[] = [];
  const conservados: DiaPlan[] = [];

  for (const d of e.dias) {
    if (d.estado === "movida") continue;
    if (d.estado === "hecha" || d.estado === "omitida") {
      conservar.push(d.id);
      conservados.push(d);
      continue;
    }
    const hecha = d.tareaEstado !== null && ESTADOS_TAREA_HECHA.includes(d.tareaEstado);
    const empezada = d.tareaEstado !== null && d.tareaEstado !== "Pendiente";
    if (hecha) {
      conservar.push(d.id);
      marcarHechas.push(d.id);
      conservados.push(d);
    } else if (d.fecha < e.hoy) {
      mover.push(d.id);
    } else if (empezada) {
      conservar.push(d.id);
      conservados.push(d);
    } else {
      borrar.push(d.id);
    }
  }

  const base = conservados.reduce((m, d) => Math.max(m, d.unidadHasta), 0);
  const cubiertas = new Set<number>();
  for (const d of conservados) for (let u = d.unidadDesde; u <= d.unidadHasta; u++) cubiertas.add(u);
  let huecos = 0;
  for (let u = 1; u <= base; u++) if (!cubiertas.has(u)) huecos++;

  const noLectivos = [...e.noLectivosAlumno, ...conservados.filter((d) => d.fecha >= e.hoy).map((d) => d.fecha)];
  const pacing = repartir({
    totalUnidades: e.totalUnidades,
    unidadesBase: base,
    desde: e.hoy > e.inicio ? e.hoy : e.inicio,
    hasta: e.fin,
    diasSemana: e.diasSemana,
    noLectivos,
    unidadTipo: e.unidadTipo,
  });
  return { conservar, marcarHechas, mover, borrar, base, huecos, pacing };
}
