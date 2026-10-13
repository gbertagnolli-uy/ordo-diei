// Horario del cofre diario (vault/LANE_92_COFRE_CUENTA_REGRESIVA.md): se puede abrir desde las 18:00
// UTC-03:00 (hora de la familia). Módulo puro: lo usa el cliente para la cuenta regresiva y es fácil de testear.
import { HORA_COFRE } from "./cofre.ts";

const HORA_MS = 3_600_000;
export const DIA_MS = 24 * HORA_MS;
export const OFFSET_FAMILIA_HORAS = -3; // UTC-03:00

/** Instante (ms UTC) de las 18:00 de la fecha de la familia en la que cae `ahora` */
export function cofreDeHoy(ahora: number): number {
  const local = new Date(ahora + OFFSET_FAMILIA_HORAS * HORA_MS); // los getUTC* de este Date son la hora de la familia
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), HORA_COFRE - OFFSET_FAMILIA_HORAS);
}

/** ¿Los dos instantes caen el mismo día para la familia? */
export const mismoDia = (a: number, b: number) => cofreDeHoy(a) === cofreDeHoy(b);

export type EstadoCofre =
  /** Falta para las 18:00 de hoy: deshabilitado */
  | { fase: "cuenta"; restanteMs: number; progreso: number }
  /** Ya son las 18:00 o más y hay un cofre para abrir */
  | { fase: "listo"; restanteMs: 0; progreso: 0 }
  /** Pasaron las 18:00 y no hay cofre (ya se abrió o no llegó): cuenta para el de mañana */
  | { fase: "espera"; restanteMs: number; progreso: number };

/**
 * La barra arranca llena 24 h antes de las 18:00 y se vacía hasta llegar a ellas
 * (progreso = tiempo que falta / 24 h).
 */
export function estadoCofre(ahora: number, hayCofre: boolean): EstadoCofre {
  const hoy = cofreDeHoy(ahora);
  if (ahora < hoy) {
    const restanteMs = hoy - ahora;
    return { fase: "cuenta", restanteMs, progreso: Math.min(1, restanteMs / DIA_MS) };
  }
  if (hayCofre) return { fase: "listo", restanteMs: 0, progreso: 0 };
  const restanteMs = hoy + DIA_MS - ahora;
  return { fase: "espera", restanteMs, progreso: Math.min(1, restanteMs / DIA_MS) };
}

export function formatearRestante(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
