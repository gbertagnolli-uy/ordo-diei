// Racha de días en la app (vault/ENGAGEMENT_PLAN.md): cuenta los días en que la persona entró, no las tareas.
// Sin presión: un día perdido se perdona (comodín) una vez cada 7 días y nunca resta nada. Módulo puro.
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { proximoHito } from "./hitos.ts";

/** Entre un día perdonado y el siguiente tienen que pasar al menos tantos días */
export const DIAS_COMODIN = 7;
export const PUNTOS_INGRESO_DIARIO = 5;
export const XP_INGRESO_DIARIO = 5;
export const CLAVE_BIENVENIDA_VISTA = "bienvenida_vista";
const MAX_DIAS_ATRAS = 400;

export type RachaApp = {
  /** Días seguidos en la app (los perdonados no suman ni restan) */
  dias: number;
  /** Primer día de la racha vigente (null si no hay) */
  inicio: string | null;
  /** ¿Entró hoy? */
  ingresoHoy: boolean;
  /** ¿El comodín está disponible para perdonar un día perdido? */
  comodinDisponible: boolean;
  /** Último día perdonado dentro de la racha */
  ultimoComodin: string | null;
};

export type ResumenRachaApp = RachaApp & {
  diasTotales: number;
  proximoHito: { dias: number; faltan: number; titulo: string } | null;
  puntosHoy: number;
  xpHoy: number;
};

const clave = (d: Date) => format(d, "yyyy-MM-dd");
const antes = (d: string) => clave(addDays(parseISO(d), -1));

/**
 * @param fechas días (yyyy-MM-dd, en la zona de la familia) en que la persona entró
 * @param hoy hoy (yyyy-MM-dd). Si todavía no entró hoy, el día de hoy no cuenta como perdido.
 */
export function calcularRachaApp(fechas: Iterable<string>, hoy: string): RachaApp {
  const entro = new Set(fechas);
  const ingresoHoy = entro.has(hoy);
  let dias = ingresoHoy ? 1 : 0;
  let inicio: string | null = ingresoHoy ? hoy : null;
  let ultimoComodin: string | null = null;

  let d = hoy;
  for (let i = 0; i < MAX_DIAS_ATRAS; i++) {
    d = antes(d);
    if (entro.has(d)) {
      dias++;
      inicio = d;
      continue;
    }
    // Día perdido: se perdona si hay un día con ingreso justo antes y el comodín no se usó en la última semana
    const comodinLibre = ultimoComodin === null || differenceInCalendarDays(parseISO(ultimoComodin), parseISO(d)) >= DIAS_COMODIN;
    if (!entro.has(antes(d)) || !comodinLibre) break;
    ultimoComodin = d;
  }

  return {
    dias,
    inicio,
    ingresoHoy,
    ultimoComodin,
    comodinDisponible: ultimoComodin === null || differenceInCalendarDays(parseISO(hoy), parseISO(ultimoComodin)) >= DIAS_COMODIN,
  };
}

export function armarResumenRachaApp(fechas: string[], hoy: string): ResumenRachaApp {
  const racha = calcularRachaApp(fechas, hoy);
  const sig = proximoHito(racha.dias);
  return {
    ...racha,
    diasTotales: new Set(fechas).size,
    proximoHito: sig ? { dias: sig.dias, faltan: sig.dias - racha.dias, titulo: sig.titulo } : null,
    puntosHoy: racha.ingresoHoy ? PUNTOS_INGRESO_DIARIO : 0,
    xpHoy: racha.ingresoHoy ? XP_INGRESO_DIARIO : 0,
  };
}

