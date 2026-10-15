// Propio de Ordo (lane 175, L1): cuentas de la lectura real. Pura: la usan el servidor, la pantalla y los tests.
import { sumarDias } from "./semana.ts";

export const ESTADOS_LECTURA = ["por_leer", "leyendo", "leido"] as const;
export type EstadoLectura = (typeof ESTADOS_LECTURA)[number];
export const ETIQUETA_LECTURA: Record<EstadoLectura, string> = { por_leer: "Por leer", leyendo: "Leyendo", leido: "Leídos" };

/** Avance del libro de 0 a 100; null si no se sabe cuántas páginas tiene */
export function porcentajeLeido(paginaActual: number, paginasTotal: number | null | undefined): number | null {
  if (!paginasTotal || paginasTotal <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((paginaActual / paginasTotal) * 100)));
}

export type SesionBasica = { fecha: string; paginas: number; minutos: number | null };
export type ResumenLectura = { paginasSemana: number; minutosSemana: number; diasSemana: number; racha: number; librosLeidosAnio: number };

/** Días seguidos (hasta hoy, o hasta ayer si hoy todavía no leyó) con al menos una sesión */
export function rachaDeLectura(fechas: string[], hoy: string): number {
  const con = new Set(fechas);
  let dia = con.has(hoy) ? hoy : sumarDias(hoy, -1);
  let n = 0;
  while (con.has(dia)) {
    n += 1;
    dia = sumarDias(dia, -1);
  }
  return n;
}

export function resumirLectura(sesiones: SesionBasica[], hoy: string, terminadosEsteAnio = 0): ResumenLectura {
  const desde = sumarDias(hoy, -6);
  const semana = sesiones.filter((s) => s.fecha >= desde && s.fecha <= hoy);
  return {
    paginasSemana: semana.reduce((n, s) => n + s.paginas, 0),
    minutosSemana: semana.reduce((n, s) => n + (s.minutos ?? 0), 0),
    diasSemana: new Set(semana.map((s) => s.fecha)).size,
    racha: rachaDeLectura(sesiones.map((s) => s.fecha), hoy),
    librosLeidosAnio: terminadosEsteAnio,
  };
}

/** Páginas que se suman al registrar «llegué hasta la página N»: nunca negativas, y sin pasar del total si se conoce */
export function paginasNuevas(paginaActual: number, hastaPagina: number, paginasTotal: number | null): { pagina: number; leidas: number } | null {
  if (!Number.isInteger(hastaPagina) || hastaPagina < 0) return null;
  const pagina = paginasTotal ? Math.min(hastaPagina, paginasTotal) : hastaPagina;
  return { pagina, leidas: Math.max(0, pagina - paginaActual) };
}
