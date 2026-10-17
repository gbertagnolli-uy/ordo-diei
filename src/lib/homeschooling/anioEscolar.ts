// Propio de Ordo (lane 197, C9): fechas del «Configurar el año». Puro: expande rangos de vacaciones a días de semana, junta con las
// fiestas elegidas y avisa si algo no cierra. Trabaja con claves 'YYYY-MM-DD'.
import { sumarDias } from "./semana.ts";

export interface RangoVacaciones {
  motivo: string;
  desde: string;
  hasta: string;
}
export interface FiestaElegida {
  fecha: string;
  motivo: string;
}
export interface DiaSinClase {
  fecha: string;
  motivo: string;
}

export const MAX_DIAS_RANGO = 120;
export const MAX_DIAS_TOTAL = 400;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
/** 1 = lunes … 7 = domingo */
const diaSemana = (clave: string) => new Date(`${clave}T00:00:00Z`).getUTCDay() || 7;
export const esDiaHabil = (clave: string) => diaSemana(clave) <= 5;

export function validarRango(r: RangoVacaciones): string | null {
  if (!r.motivo.trim()) return "Falta el nombre de las vacaciones";
  if (!FECHA.test(r.desde) || !FECHA.test(r.hasta)) return "Fechas no válidas";
  if (r.desde > r.hasta) return `«${r.motivo.trim()}»: el inicio es posterior al fin`;
  let dias = 0;
  for (let d = r.desde; d <= r.hasta && dias <= MAX_DIAS_RANGO; d = sumarDias(d, 1)) dias += 1;
  if (dias > MAX_DIAS_RANGO) return `«${r.motivo.trim()}»: el rango es demasiado largo (máximo ${MAX_DIAS_RANGO} días)`;
  return null;
}

/** Todos los días sin clase que resultan: los días de lunes a viernes de cada rango y cada fiesta elegida; sin repetir fechas (gana el primero) */
export function expandirDiasSinClase(rangos: RangoVacaciones[], fiestas: FiestaElegida[]): DiaSinClase[] {
  const salida = new Map<string, DiaSinClase>();
  for (const r of rangos) {
    for (let d = r.desde; d <= r.hasta; d = sumarDias(d, 1)) if (esDiaHabil(d) && !salida.has(d)) salida.set(d, { fecha: d, motivo: r.motivo.trim() });
  }
  for (const f of fiestas) if (!salida.has(f.fecha)) salida.set(f.fecha, { fecha: f.fecha, motivo: f.motivo.trim() || "Fiesta" });
  return [...salida.values()].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}
