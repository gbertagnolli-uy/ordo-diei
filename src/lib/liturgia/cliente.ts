// Utilidades de las pantallas de liturgia (lado cliente, puras salvo el acceso a localStorage).
import { aISO, fechaDeISO, sumarDias } from "./calendario.ts";
import { parsearFecha } from "./parametros.ts";
import { esVersionLiturgica, VERSION_PREDETERMINADA } from "./tipos.ts";
import type { VersionLiturgica } from "./tipos.ts";

/** Hoy en la zona horaria del navegador, como `YYYY-MM-DD`. */
export function hoyISO(ahora: Date = new Date()): string {
  return aISO({ y: ahora.getFullYear(), m: ahora.getMonth() + 1, d: ahora.getDate() });
}

export function moverFecha(iso: string, dias: number): string {
  return aISO(sumarDias(fechaDeISO(iso), dias));
}

/** Fecha válida de la URL o, si no hay/está mal, hoy. */
export function fechaDeParametro(valor: string | null | undefined, ahora: Date = new Date()): string {
  const r = parsearFecha(valor);
  return r.ok ? r.valor : hoyISO(ahora);
}

/**
 * Versión efectiva de una pantalla (SPEC §7): la de la URL; si no hay, la recordada en este
 * dispositivo; si no hay ninguna, 1906.
 */
export function resolverVersion(urlVersion: string | null | undefined, guardada: string | null | undefined): VersionLiturgica {
  if (esVersionLiturgica(urlVersion)) return urlVersion;
  if (esVersionLiturgica(guardada)) return guardada;
  return VERSION_PREDETERMINADA;
}

const claveAlmacen = (pantalla: string) => `liturgia:version:${pantalla}`;

export function leerVersionGuardada(pantalla: string): string | null {
  try {
    return window.localStorage.getItem(claveAlmacen(pantalla));
  } catch {
    return null; // modo privado, almacenamiento bloqueado…
  }
}

export function guardarVersion(pantalla: string, version: VersionLiturgica): void {
  try {
    window.localStorage.setItem(claveAlmacen(pantalla), version);
  } catch {
    /* se ignora: la preferencia es una comodidad, no un dato */
  }
}

export const NOMBRES_VERSION: Record<VersionLiturgica, string> = {
  "1906": "Tridentine - 1906",
  "1888": "Tridentine - 1888",
  "1570": "Tridentine - 1570",
};

/** Nota de D53: para 1888 y 1906 DO usa el Misal de 1910. Solo se muestra en Missale. */
export const NOTA_MISAL_1910 = "DO usa el Misal de 1910 para esta versión.";
