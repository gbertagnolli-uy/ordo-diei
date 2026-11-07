// Premio grupal (lane 274, Plane #33): reglas puras (sin base). Fechas como "YYYY-MM-DD" en la zona de la familia.

export const MAX_DIAS_PERIODO = 92;
export const DIAS_MOSTRAR_RESULTADO = 7;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export type EstadoPremioGrupal = "proximo" | "en-curso" | "por-evaluar" | "logrado" | "no-logrado";

export interface EntradaPremioGrupal {
  titulo: string;
  descripcion: string | null;
  porcentajeMeta: number;
  desde: string;
  hasta: string;
}

const diasEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

export function validarPremioGrupal(e: Record<string, unknown>): EntradaPremioGrupal {
  const titulo = typeof e.titulo === "string" ? e.titulo.trim() : "";
  if (titulo.length < 3 || titulo.length > 120) throw new Error("El premio necesita un título de 3 a 120 caracteres");
  const descripcion = typeof e.descripcion === "string" && e.descripcion.trim() ? e.descripcion.trim().slice(0, 500) : null;
  const porcentajeMeta = Number(e.porcentajeMeta);
  if (!Number.isInteger(porcentajeMeta) || porcentajeMeta < 1 || porcentajeMeta > 100) throw new Error("La meta es un % entero entre 1 y 100");
  const desde = String(e.desde ?? "");
  const hasta = String(e.hasta ?? "");
  if (!FECHA.test(desde) || !FECHA.test(hasta) || Number.isNaN(Date.parse(desde)) || Number.isNaN(Date.parse(hasta))) {
    throw new Error("Fechas inválidas");
  }
  const dias = diasEntre(desde, hasta);
  if (dias < 0) throw new Error("La fecha de fin no puede ser anterior a la de inicio");
  if (dias + 1 > MAX_DIAS_PERIODO) throw new Error(`El período puede durar como máximo ${MAX_DIAS_PERIODO} días`);
  return { titulo, descripcion, porcentajeMeta, desde, hasta };
}

export function porcentajeGrupal(hechas: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.floor((hechas / total) * 100));
}

/** ¿Se solapan dos períodos (fechas inclusive)? */
export const seSolapan = (a: { desde: string; hasta: string }, b: { desde: string; hasta: string }) => a.desde <= b.hasta && b.desde <= a.hasta;

export function estadoPremio(p: { desde: string; hasta: string; evaluado: boolean; cumplido: boolean | null }, hoy: string): EstadoPremioGrupal {
  if (p.evaluado) return p.cumplido ? "logrado" : "no-logrado";
  if (hoy < p.desde) return "proximo";
  if (hoy <= p.hasta) return "en-curso";
  return "por-evaluar";
}

/** Se muestra en la pantalla de la familia: en curso, por evaluar, o terminado hace ≤ 7 días */
export function esVisible(p: { desde: string; hasta: string }, hoy: string): boolean {
  return p.desde <= hoy && diasEntre(p.hasta, hoy) <= DIAS_MOSTRAR_RESULTADO;
}
