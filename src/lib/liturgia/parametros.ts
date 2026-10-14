// Validación de los parámetros de /api/liturgia/* (SPEC liturgia §6). Puro: sin Next ni Prisma.
import { esHora, esVersionLiturgica, VERSION_PREDETERMINADA } from "./tipos.ts";
import type { Hora, TipoDocumento, VersionLiturgica } from "./tipos.ts";

export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };
const ok = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
const mal = (error: string): Resultado<never> => ({ ok: false, error });

/** `YYYY-MM-DD` real (rechaza 2026-02-30). */
export function parsearFecha(s: string | null | undefined): Resultado<string> {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return mal("fecha debe tener formato YYYY-MM-DD");
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return mal("la fecha no existe");
  }
  return ok(s);
}

/** Sin `version` ⇒ 1906 (D43). Con una desconocida ⇒ error. */
export function parsearVersion(s: string | null | undefined): Resultado<VersionLiturgica> {
  if (s == null || s === "") return ok(VERSION_PREDETERMINADA);
  return esVersionLiturgica(s) ? ok(s) : mal("version debe ser 1906, 1888 o 1570");
}

export function parsearAnioMes(
  anio: string | null | undefined,
  mes: string | null | undefined,
): Resultado<{ anio: number; mes: number }> {
  const a = Number(anio);
  const m = Number(mes);
  if (!Number.isInteger(a) || a < 1900 || a > 2200) return mal("anio inválido");
  if (!Number.isInteger(m) || m < 1 || m > 12) return mal("mes debe estar entre 1 y 12");
  return ok({ anio: a, mes: m });
}

export function parsearHora(s: string | null | undefined): Resultado<Hora> {
  return esHora(s) ? ok(s) : mal("hora inválida (Matutinum, Laudes, Prima, Tertia, Sexta, Nona, Vespera, Completorium)");
}

/** Claves de libro: solo letras, números, `/`, `-`, `_`, `.`; sin `..` (no se usan como ruta, pero se validan igual). */
export function parsearClave(s: string | null | undefined): Resultado<string> {
  if (!s || s.length > 200) return mal("clave requerida");
  if (!/^[\p{L}\p{N}/_.\- ]+$/u.test(s) || s.includes("..")) return mal("clave inválida");
  return ok(s);
}

export const TIPOS_DE_LIBRO = ["proprium-de-tempore", "proprium-sanctorum", "ordinarium", "psalterium", "rosarium"] as const;
export type TipoLibro = (typeof TIPOS_DE_LIBRO)[number];

export function parsearTipoLibro(s: string | null | undefined): Resultado<TipoLibro> {
  return (TIPOS_DE_LIBRO as readonly string[]).includes(s ?? "") ? ok(s as TipoLibro) : mal("tipo de libro inválido");
}

/**
 * Prefijos de `Documentos_Liturgicos.Clave` (tipo "libro") de cada libro, según los nombra el
 * generador (scripts/liturgia/generar.ts → generarLibros): `Sancti/10-14`, `Tempora/…`, `Commune/…`,
 * `Missa/<Sancti|Tempora|Commune>/…`, `Missa/Ordo/…`, `Psalterium/…`. El Rosario no sale de DO: lo
 * escribe L9 en `src/data/liturgia/rosarium.json`, no en la base.
 */
export const PREFIJO_CLAVE_LIBRO: Record<TipoLibro, string[]> = {
  "proprium-de-tempore": ["Tempora/", "Commune/", "Missa/Tempora/", "Missa/Commune/"],
  "proprium-sanctorum": ["Sancti/", "Missa/Sancti/"],
  ordinarium: ["Missa/Ordo/", "Psalterium/Common/"],
  psalterium: ["Psalterium/"],
  rosarium: ["Rosarium/"],
};

/** ¿Esta clave pertenece a ese libro? (evita pedir `Sancti/…` bajo el tipo `psalterium`). */
export function claveEsDeLibro(tipo: TipoLibro, clave: string): boolean {
  return PREFIJO_CLAVE_LIBRO[tipo].some((p) => clave.startsWith(p));
}

export type { TipoDocumento };
