// Horas de estudio de un alumno por materia (H5). Puro: lo arma `servidor/horas.ts` con Prisma y lo prueba `horas.test.ts`.
// Horas de lecciones: cada DiaLectivo `hecha` suma `Tarea.tiempoRealEjecucionSeg` si existe y es > 0; si no, unidades · minutosPorUnidad.
// Horas de actividades: `fin − inicio` por cada participante (una salida con dos hijos suma a los dos).

export type DiaParaHoras = {
  fecha: string; // YYYY-MM-DD
  estado: string;
  unidadDesde: number;
  unidadHasta: number;
  minutosPorUnidad: number;
  tiempoRealSeg: number | null;
  materiaId: number;
  materiaNombre: string;
};

export type ActividadParaHoras = {
  fecha: string; // día de inicio en la zona de la familia
  inicio: Date;
  fin: Date;
  materiaId: number;
  materiaNombre: string;
  participantes: number[];
};

export type EntradaHoras = {
  alumnoId: number;
  desde: string;
  hasta: string;
  dias: DiaParaHoras[];
  actividades: ActividadParaHoras[];
  /** Notas de los IntentoQuiz aprobados del alumno (si existe H4) */
  notas?: { materiaId: number; nota: number }[];
};

export type HorasMateria = {
  materiaId: number;
  nombre: string;
  minutosLecciones: number;
  minutosActividades: number;
  minutosTotal: number;
  leccionesHechas: number;
  leccionesPlanificadas: number;
  promedioNotas: number | null;
};

export type ResumenHoras = {
  materias: HorasMateria[];
  totales: { minutos: number; leccionesHechas: number; leccionesPlanificadas: number; actividades: number };
};

const enPeriodo = (fecha: string, desde: string, hasta: string) => fecha >= desde && fecha <= hasta;

export function minutosDeDia(d: Pick<DiaParaHoras, "unidadDesde" | "unidadHasta" | "minutosPorUnidad" | "tiempoRealSeg">): number {
  if (d.tiempoRealSeg && d.tiempoRealSeg > 0) return Math.round(d.tiempoRealSeg / 60);
  return (d.unidadHasta - d.unidadDesde + 1) * d.minutosPorUnidad;
}

export function sumarHoras(e: EntradaHoras): ResumenHoras {
  const porMateria = new Map<number, HorasMateria>();
  const fila = (materiaId: number, nombre: string) => {
    let f = porMateria.get(materiaId);
    if (!f) {
      f = { materiaId, nombre, minutosLecciones: 0, minutosActividades: 0, minutosTotal: 0, leccionesHechas: 0, leccionesPlanificadas: 0, promedioNotas: null };
      porMateria.set(materiaId, f);
    }
    return f;
  };

  for (const d of e.dias) {
    if (!enPeriodo(d.fecha, e.desde, e.hasta) || d.estado === "movida") continue;
    const f = fila(d.materiaId, d.materiaNombre);
    const unidades = d.unidadHasta - d.unidadDesde + 1;
    f.leccionesPlanificadas += unidades;
    if (d.estado === "hecha") {
      f.leccionesHechas += unidades;
      f.minutosLecciones += minutosDeDia(d);
    }
  }

  let actividades = 0;
  for (const a of e.actividades) {
    if (!enPeriodo(a.fecha, e.desde, e.hasta) || !a.participantes.includes(e.alumnoId)) continue;
    const minutos = Math.max(0, Math.round((a.fin.getTime() - a.inicio.getTime()) / 60000));
    fila(a.materiaId, a.materiaNombre).minutosActividades += minutos;
    actividades++;
  }

  for (const f of porMateria.values()) {
    f.minutosTotal = f.minutosLecciones + f.minutosActividades;
    const notas = (e.notas ?? []).filter((n) => n.materiaId === f.materiaId).map((n) => n.nota);
    f.promedioNotas = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null;
  }

  const materias = [...porMateria.values()].sort((a, b) => b.minutosTotal - a.minutosTotal || a.nombre.localeCompare(b.nombre));
  return {
    materias,
    totales: {
      minutos: materias.reduce((n, m) => n + m.minutosTotal, 0),
      leccionesHechas: materias.reduce((n, m) => n + m.leccionesHechas, 0),
      leccionesPlanificadas: materias.reduce((n, m) => n + m.leccionesPlanificadas, 0),
      actividades,
    },
  };
}

/** «1 h 30 min» / «45 min» */
export function formatoDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Período de un reporte: año escolar (del 1 de marzo al 28/29 de febrero), trimestre del año o mes */
export function periodoDe(tipo: "anio" | "trimestre" | "mes", ref: string): { desde: string; hasta: string } {
  const [y, m] = ref.split("-").map(Number);
  const ultimo = (anio: number, mes: number) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const p = (n: number) => String(n).padStart(2, "0");
  if (tipo === "mes") return { desde: `${y}-${p(m)}-01`, hasta: `${y}-${p(m)}-${p(ultimo(y, m))}` };
  if (tipo === "trimestre") {
    const ini = Math.floor((m - 1) / 3) * 3 + 1;
    return { desde: `${y}-${p(ini)}-01`, hasta: `${y}-${p(ini + 2)}-${p(ultimo(y, ini + 2))}` };
  }
  const inicio = m >= 3 ? y : y - 1;
  return { desde: `${inicio}-03-01`, hasta: `${inicio + 1}-02-${p(ultimo(inicio + 1, 2))}` };
}
