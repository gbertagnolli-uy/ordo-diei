// Aritmética del año litúrgico preconciliar (1570 / 1888 / 1906): solo las fronteras de los
// tiempos, que son las mismas en las tres versiones. Qué se celebra cada día lo calcula
// Divinum Officium (D47); esto da `DiaLiturgico.tiempo` y sirve de oráculo en las pruebas.
import type { TiempoLiturgico } from "./tipos.ts";

export type Fecha = { y: number; m: number; d: number };

const MS_DIA = 86_400_000;
const utc = (f: Fecha) => Date.UTC(f.y, f.m - 1, f.d);
const dias = (ms: number) => Math.round(ms / MS_DIA);

export function fechaDeISO(iso: string): Fecha {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new Error(`Fecha inválida: ${iso}`);
  return { y: +m[1], m: +m[2], d: +m[3] };
}

export function aISO(f: Fecha): string {
  return `${String(f.y).padStart(4, "0")}-${String(f.m).padStart(2, "0")}-${String(f.d).padStart(2, "0")}`;
}

export function sumarDias(f: Fecha, n: number): Fecha {
  const x = new Date(utc(f) + n * MS_DIA);
  return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() };
}

/** 0 = domingo … 6 = sábado. */
export function diaDeSemana(f: Fecha): number {
  return new Date(utc(f)).getUTCDay();
}

/** Domingo de Pascua (calendario gregoriano, algoritmo anónimo de Meeus/Jones/Butcher). */
export function pascua(y: number): Fecha {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return { y, m: mes, d: dia };
}

/** Primer domingo de Adviento: el domingo más cercano al 30 de noviembre (27-nov … 3-dic). */
export function adviento(y: number): Fecha {
  const nov27 = { y, m: 11, d: 27 };
  const dow = diaDeSemana(nov27);
  return sumarDias(nov27, (7 - dow) % 7);
}

export function tiempoLiturgico(f: Fecha): TiempoLiturgico {
  const hoy = utc(f);
  const p = utc(pascua(f.y));
  const septuagesima = p - 63 * MS_DIA;
  const cenizas = p - 46 * MS_DIA;
  const pasion = p - 14 * MS_DIA;
  const pentecostes = p + 49 * MS_DIA;
  const advientoInicio = utc(adviento(f.y));
  if (hoy >= advientoInicio) return f.m === 12 && f.d >= 25 ? "navidad" : "adviento";
  if (f.m === 1 && f.d <= 5) return "navidad";
  if (hoy < septuagesima) return "epifania";
  if (hoy < cenizas) return "septuagesima";
  if (hoy < pasion) return "cuaresma";
  if (hoy < p) return "pasion";
  if (hoy < pentecostes) return "pascua";
  return "pentecostes";
}

export function diferenciaDias(a: Fecha, b: Fecha): number {
  return dias(utc(a) - utc(b));
}
