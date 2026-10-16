// Niveles de conducta diaria (vault/LANE_205_CONDUCTA_DIARIA.md). Sin dependencias: se usa en cliente y servidor.

export const NIVELES_CONDUCTA = [
  { valor: 1, etiqueta: "Muy mal" },
  { valor: 2, etiqueta: "Mal" },
  { valor: 3, etiqueta: "Regular" },
  { valor: 4, etiqueta: "Bien" },
  { valor: 5, etiqueta: "Excelente" },
] as const;

export const NIVEL_CONDUCTA_DEFAULT = 4;
export const MAX_NOTA_CONDUCTA = 500;

export const esNivelConducta = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5;

export const etiquetaConducta = (nivel: number) => NIVELES_CONDUCTA.find((n) => n.valor === Math.round(nivel))?.etiqueta ?? "—";

/** Promedio redondeado a un decimal, o null si no hay registros. */
export function promedioConducta(niveles: number[]): number | null {
  if (niveles.length === 0) return null;
  return Math.round((niveles.reduce((a, n) => a + n, 0) / niveles.length) * 10) / 10;
}

/** «YYYY-MM-DD» válido (para la columna de fecha sin hora). */
export const esFechaDia = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
