// Meta semanal en familia (vault/ENGAGEMENT_PLAN.md, lane 202): reglas puras. La semana va de lunes a domingo.
import { addDays, format, parseISO, startOfISOWeek } from "date-fns";

export const MAX_OBJETIVO = 500;
export const MIN_PREMIO = 3;
export const MAX_PREMIO = 80;

const clave = (d: Date) => format(d, "yyyy-MM-dd");

/** Lunes (yyyy-MM-dd) de la semana en la que cae `dia` */
export const lunesDe = (dia: string) => clave(startOfISOWeek(parseISO(dia)));

/** Lunes de la semana siguiente */
export const lunesSiguiente = (lunes: string) => clave(addDays(parseISO(lunes), 7));

/** Lunes de la semana anterior */
export const lunesAnterior = (lunes: string) => clave(addDays(parseISO(lunes), -7));

/** Objetivo sugerido: un poco más que la semana pasada (≈ +10 %), con un mínimo para empezar */
export function sugerirObjetivo(semanaPasada: number): number {
  if (semanaPasada <= 0) return 10;
  return Math.max(5, Math.ceil(semanaPasada * 1.1));
}

export type EntradaMeta = { objetivo: number; premio: string };

/** Valida lo que mandan los padres; falla con un mensaje claro */
export function validarMeta(entrada: Record<string, unknown>): EntradaMeta {
  const objetivo = Number(entrada.objetivo);
  const premio = typeof entrada.premio === "string" ? entrada.premio.trim() : "";
  if (!Number.isInteger(objetivo) || objetivo < 1 || objetivo > MAX_OBJETIVO) throw new Error(`El objetivo tiene que ser un número entero entre 1 y ${MAX_OBJETIVO}`);
  if (premio.length < MIN_PREMIO) throw new Error("Escribí cuál es el premio de la semana");
  if (premio.length > MAX_PREMIO) throw new Error(`El premio no puede superar los ${MAX_PREMIO} caracteres`);
  return { objetivo, premio };
}

/** Porcentaje de avance, entre 0 y 100 */
export const porcentaje = (actual: number, objetivo: number) => (objetivo > 0 ? Math.min(100, Math.floor((actual / objetivo) * 100)) : 0);

export const cumple = (actual: number, objetivo: number) => objetivo > 0 && actual >= objetivo;
