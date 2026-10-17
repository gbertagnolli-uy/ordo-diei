// Propio de Ordo (lane 173, P2): fechas de la hoja semanal. Pura y sin zona horaria: trabaja con claves 'YYYY-MM-DD'.

const DIA_MS = 86_400_000;
const aMs = (clave: string) => Date.parse(`${clave}T00:00:00Z`);
const aClave = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Lunes de la semana de una fecha (la semana va de lunes a domingo) */
export function lunesDe(clave: string): string {
  const d = new Date(aMs(clave));
  const iso = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  return aClave(aMs(clave) - (iso - 1) * DIA_MS);
}

export function sumarDias(clave: string, n: number): string {
  return aClave(aMs(clave) + n * DIA_MS);
}

/** Los siete días de la semana que empieza en `lunes` */
export function diasDeSemana(lunes: string): string[] {
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

export const esFechaValida = (c: string) => /^\d{4}-\d{2}-\d{2}$/.test(c) && aClave(aMs(c)) === c;

const NOMBRES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/** «lunes 13» */
export function etiquetaDia(clave: string): string {
  const iso = new Date(aMs(clave)).getUTCDay() || 7;
  return `${NOMBRES[iso - 1]} ${Number(clave.slice(8))}`;
}
