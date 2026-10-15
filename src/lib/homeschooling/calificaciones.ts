// Propio de Ordo (lane 172, K1): cuentas de la libreta. La nota es un entero de 0 a 100; la letra y los promedios se calculan acá,
// una sola vez, para que la pantalla, el boletín impreso y los tests muestren lo mismo.

export const TIPOS_CALIFICACION = ["tarea", "examen", "proyecto", "lectura", "oral"] as const;
export type TipoCalificacion = (typeof TIPOS_CALIFICACION)[number];

export const ETIQUETA_CALIFICACION: Record<TipoCalificacion, string> = {
  tarea: "Tarea",
  examen: "Examen",
  proyecto: "Proyecto",
  lectura: "Lectura",
  oral: "Oral",
};

/** Escala común (90/80/70/60). Un padre que use otra solo mira el número. */
export function letraDe(puntaje: number): "A" | "B" | "C" | "D" | "F" {
  if (puntaje >= 90) return "A";
  if (puntaje >= 80) return "B";
  if (puntaje >= 70) return "C";
  if (puntaje >= 60) return "D";
  return "F";
}

export function puntajeValido(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 100;
}

/** Promedio simple redondeado a un decimal; null si no hay notas */
export function promedio(puntajes: number[]): number | null {
  if (puntajes.length === 0) return null;
  return Math.round((puntajes.reduce((a, b) => a + b, 0) / puntajes.length) * 10) / 10;
}

/** Tono de la nota para colorear: bien (≥80), medio (≥60), bajo */
export function tonoDe(puntaje: number): "bien" | "medio" | "bajo" {
  return puntaje >= 80 ? "bien" : puntaje >= 60 ? "medio" : "bajo";
}

export type NotaLibreta = { id: number; fecha: string; titulo: string; tipo: TipoCalificacion; puntaje: number; comentario: string | null; diaLectivoId: number | null };
export type MateriaLibreta = { materiaId: number; materia: string; color: string | null; promedio: number | null; letra: string | null; notas: NotaLibreta[] };

/** Agrupa las notas por materia (las más nuevas primero) y calcula el promedio de cada una */
export function armarLibreta(filas: (NotaLibreta & { materiaId: number; materia: string; color: string | null })[], materiasSinNotas: { id: number; nombre: string; color: string | null }[] = []): MateriaLibreta[] {
  const por = new Map<number, MateriaLibreta>();
  for (const m of materiasSinNotas) por.set(m.id, { materiaId: m.id, materia: m.nombre, color: m.color, promedio: null, letra: null, notas: [] });
  for (const f of filas) {
    const g = por.get(f.materiaId) ?? { materiaId: f.materiaId, materia: f.materia, color: f.color, promedio: null, letra: null, notas: [] };
    g.notas.push({ id: f.id, fecha: f.fecha, titulo: f.titulo, tipo: f.tipo, puntaje: f.puntaje, comentario: f.comentario, diaLectivoId: f.diaLectivoId });
    por.set(f.materiaId, g);
  }
  const salida = [...por.values()];
  for (const g of salida) {
    g.notas.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.id - a.id));
    g.promedio = promedio(g.notas.map((n) => n.puntaje));
    g.letra = g.promedio === null ? null : letraDe(g.promedio);
  }
  return salida.sort((a, b) => a.materia.localeCompare(b.materia, "es"));
}

/** Promedio general: el de todas las notas (cada nota pesa igual) */
export function promedioGeneral(materias: MateriaLibreta[]): number | null {
  return promedio(materias.flatMap((m) => m.notas.map((n) => n.puntaje)));
}
