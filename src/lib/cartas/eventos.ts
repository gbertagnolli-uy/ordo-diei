// Lógica de fechas, festividades, cumpleaños y eventos litúrgicos (D5, D6, D17)

import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import { TZDate, tz } from "@date-fns/tz";
import { BONO_FIESTA_TIENDA, SOBRE_REVELACION } from "./economia.ts";

export const APP_TZ = process.env.APP_TZ || "America/Montevideo";

/**
 * Determina si un año es bisiesto según el calendario gregoriano.
 */
export function esAnioBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

/**
 * Obtiene la fecha actual en formato "MM-dd" en la zona horaria dada.
 */
export function hoyMesDiaEnTz(ahora: Date = new Date(), timezone: string = APP_TZ): string {
  return format(ahora, "MM-dd", { in: tz(timezone) });
}

/**
 * Obtiene el año actual en la zona horaria dada (como string, ej: "2026").
 */
export function hoyAnioEnTz(ahora: Date = new Date(), timezone: string = APP_TZ): string {
  return format(ahora, "yyyy", { in: tz(timezone) });
}

/**
 * Comprueba si hoy es el día de fiesta de la carta (D5).
 * celebracion: formato "MM-dd" (ej: "10-04" para San Francisco de Asís).
 */
export function esFiestaHoy(
  celebracion?: string | null,
  ahora: Date = new Date(),
  timezone: string = APP_TZ
): boolean {
  if (!celebracion) return false;
  const hoy = hoyMesDiaEnTz(ahora, timezone);
  return celebracion === hoy;
}

/**
 * Fragmentos regalados en el día de fiesta de una carta (D21): la carta entera
 * (+100 %), la tenga o no. Si ya está al tope, lo que sobra se convierte en Incienso.
 */
export function regaloFiesta(fragmentosRequeridos: number): number {
  return fragmentosRequeridos;
}

/**
 * Comprueba si hoy es el cumpleaños del usuario (D6).
 * Regla 29 de febrero: en años NO bisiestos, se celebra el 28 de febrero.
 */
export function esCumpleHoy(
  fechaNacimiento: Date | string,
  ahora: Date = new Date(),
  timezone: string = APP_TZ
): boolean {
  let mesDia: string;

  if (typeof fechaNacimiento === "string") {
    const limpia = fechaNacimiento.trim();
    if (/^\d{2}-\d{2}$/.test(limpia)) {
      mesDia = limpia;
    } else if (/^\d{4}-\d{2}-\d{2}/.test(limpia)) {
      mesDia = limpia.slice(5, 10);
    } else {
      const parsed = new Date(limpia);
      mesDia = parsed.toISOString().slice(5, 10);
    }
  } else {
    // Si la fecha fue guardada a medianoche UTC (ej: Prisma o new Date("YYYY-MM-DD")):
    // usar los componentes UTC para no retrasar un día en husos horarios occidentales (UTC-3)
    const iso = fechaNacimiento.toISOString();
    if (iso.endsWith("T00:00:00.000Z") || iso.endsWith("T12:00:00.000Z")) {
      mesDia = iso.slice(5, 10);
    } else {
      mesDia = format(fechaNacimiento, "MM-dd", { in: tz(timezone) });
    }
  }

  const anioActual = parseInt(hoyAnioEnTz(ahora, timezone), 10);
  const hoy = hoyMesDiaEnTz(ahora, timezone);
  const bisiesto = esAnioBisiesto(anioActual);

  if (mesDia === "02-29") {
    return bisiesto ? hoy === "02-29" : hoy === "02-28";
  }

  return hoy === mesDia;
}

/**
 * Calcula los fragmentos regalados para una carta en el cumpleaños del usuario (D6):
 * Todos los fragmentos que le faltan para llegar al 100% (desbloquearla).
 * Si ya tiene el 100% o más, devuelve 0.
 */
export function regaloCumple(
  fragmentosRequeridos: number,
  fragmentosActuales: number
): number {
  return Math.max(0, fragmentosRequeridos - fragmentosActuales);
}

/**
 * Recompensa alternativa cuando el usuario ya tiene al 100% las cartas del día
 * o no hay cartas celebradas en su fecha de cumpleaños (D6).
 */
export const REGALO_CUMPLE_FALLBACK = {
  tipo: "sobre_revelacion_gratis" as const,
  nombreSobre: SOBRE_REVELACION.nombre,
};

/**
 * Multiplicador en tienda para fragmentos de una carta (D17):
 * El día de su fiesta, se multiplican ×1,5. Los demás días, ×1.
 */
export function multiplicadorTienda(
  celebracion?: string | null,
  ahora: Date = new Date(),
  timezone: string = APP_TZ
): number {
  if (esFiestaHoy(celebracion, ahora, timezone)) {
    return BONO_FIESTA_TIENDA;
  }
  return 1.0;
}

/** Medianoche de hoy en la zona de la familia (no en la del servidor, que en Vercel es UTC) */
export function inicioDelDiaEnTz(ahora: Date = new Date(), timezone: string = APP_TZ): Date {
  return startOfDay(new TZDate(ahora.getTime(), timezone));
}

/** Días que faltan para la próxima fiesta "MM-DD" contando en la zona de la familia (0 = hoy) */
export function diasHastaFiesta(celebracion: string, ahora: Date = new Date(), timezone: string = APP_TZ): number {
  const hoy = format(ahora, "yyyy-MM-dd", { in: tz(timezone) });
  const anio = Number(hoy.slice(0, 4));
  const objetivo = `${anio}-${celebracion}` >= hoy ? `${anio}-${celebracion}` : `${anio + 1}-${celebracion}`;
  return differenceInCalendarDays(parseISO(objetivo), parseISO(hoy));
}
