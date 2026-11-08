// Diario (lane 292): piezas comunes de los lectores. Portado de vendor/Daily_You/lib/utils/imports/{import_text,import_time,import_attachments}.dart,
// de vendor/Daily_You/lib/models/mood.dart (Demizo/Daily_You@7cc237d) y de vendor/moodiary/.../import/import_media_stage.dart (ZhuJHua/moodiary@2c552dd).
import { unzipSync } from "fflate";
import { ImportacionError, type Archivos, type MomentoImport } from "./tipos.ts";

// ── Ánimo (Daily You `Mood`) ─────────────────────────────────────────────────

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** `Mood.fromRating`: un puntaje de 1 a 5 (peor a mejor, o al revés con `mejorPrimero`) al ánimo 1–5; fuera de rango se lleva al borde. */
export function animoDePuntaje(puntaje: number, mejorPrimero = false): number {
  const pos = clamp(Math.trunc(puntaje), 1, 5) - 1;
  return (mejorPrimero ? 4 - pos : pos) + 1;
}

/** `Mood.fromLegacy`: el ánimo viejo de Daily You iba de −2 a 2. */
export const animoLegado = (viejo: number | null | undefined): number | null => (typeof viejo === "number" && Number.isFinite(viejo) ? clamp(Math.trunc(viejo) + 2, 0, 4) + 1 : null);

/** El ánimo 1–5 de un JSON de Daily You o propio; cualquier otra cosa es «sin ánimo». */
export const animoValido = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5 ? v : null);

// ── Tiempos (Daily You `import_time`) ────────────────────────────────────────

const dos = (n: number) => String(n).padStart(2, "0");
const claveFecha = (y: number, m: number, d: number) => `${String(y).padStart(4, "0")}-${dos(m)}-${dos(d)}`;

export function fechaValida(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const f = new Date(Date.UTC(y, m - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

const RE_ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,]\d+)?)?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i;

/** Un ISO 8601: con zona (`Z`, `+02:00`) es un instante; sin zona es hora de pared. Devuelve null si no se entiende. */
export function momentoDeIso(texto: unknown): MomentoImport | null {
  if (typeof texto !== "string") return null;
  const m = RE_ISO.exec(texto.trim());
  if (!m) return null;
  const [y, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (!fechaValida(y, mes, d)) return null;
  const h = m[4] === undefined ? null : Number(m[4]);
  const mi = m[5] === undefined ? 0 : Number(m[5]);
  if (h !== null && (h > 23 || mi > 59)) return null;
  if (m[7]) {
    const t = Date.parse(texto.trim().replace(" ", "T"));
    if (Number.isNaN(t)) return null;
    return { fecha: null, hora: null, instante: new Date(t).toISOString() };
  }
  return { fecha: claveFecha(y, mes, d), hora: h === null ? null : h * 60 + mi, instante: null };
}

/** Daily You `wallClockOf(utc + desfase)`: la hora que marcaba el reloj de quien escribió. */
export function momentoDePared(msUtc: number, desfaseMs = 0): MomentoImport | null {
  if (!Number.isFinite(msUtc) || !Number.isFinite(desfaseMs)) return null;
  const d = new Date(msUtc + desfaseMs);
  if (Number.isNaN(d.getTime())) return null;
  return { fecha: claveFecha(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()), hora: d.getUTCHours() * 60 + d.getUTCMinutes(), instante: null };
}

/** Un instante (milisegundos desde 1970 en UTC). */
export function momentoDeInstante(ms: number): MomentoImport | null {
  const d = new Date(ms);
  return Number.isFinite(ms) && !Number.isNaN(d.getTime()) ? { fecha: null, hora: null, instante: d.toISOString() } : null;
}

// ── Texto ────────────────────────────────────────────────────────────────────

export const aTexto = (b: Uint8Array): string => new TextDecoder("utf-8").decode(b).replace(/^﻿/, "");

/** El cuerpo sin espacios de más; vacío si no hay nada. */
export const limpiarCuerpo = (s: string | null | undefined): string => (s ?? "").replace(/\r\n?/g, "\n").trim();

export const titulo = (s: unknown): string | null => {
  const t = typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";
  return t ? t : null;
};

// ── Colores e íconos ─────────────────────────────────────────────────────────

/** Los colores de Dart son un entero ARGB; la app guarda `#rrggbb`. */
export function colorDeEntero(n: unknown): string | null {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 0xffffffff) return null;
  return `#${(n & 0xffffff).toString(16).padStart(6, "0")}`;
}

export const colorHex = (s: unknown): string | null => (typeof s === "string" && /^#[0-9a-f]{6}$/i.test(s.trim()) ? s.trim().toLowerCase() : null);

// ── Rutas de archivos ────────────────────────────────────────────────────────

/** Ruta con `/`, sin `./` ni `..`; null si sale de la raíz. */
export function normalizarRuta(ruta: string): string | null {
  const partes: string[] = [];
  for (const p of ruta.replace(/\\/g, "/").split("/")) {
    if (p === "" || p === ".") continue;
    if (p === "..") {
      if (!partes.length) return null;
      partes.pop();
    } else partes.push(p);
  }
  return partes.length ? partes.join("/") : null;
}

export const carpetaDe = (ruta: string): string => (ruta.includes("/") ? ruta.slice(0, ruta.lastIndexOf("/")) : "");
export const nombreDe = (ruta: string): string => ruta.slice(ruta.lastIndexOf("/") + 1);
export const extensionDe = (ruta: string): string => {
  const n = nombreDe(ruta);
  return n.includes(".") ? n.slice(n.lastIndexOf(".")).toLowerCase() : "";
};

const EXT_IMAGEN = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".heic", ".heif", ".avif"]);
export const esImagen = (ruta: string) => EXT_IMAGEN.has(extensionDe(ruta));

/** Resuelve `rel` desde la carpeta `base`; con o sin mayúsculas. Devuelve la ruta que existe en `archivos`, o null. */
export function resolverArchivo(archivos: Archivos, base: string, rel: string): string | null {
  let destino = rel.trim();
  if (destino.startsWith("<") && destino.endsWith(">")) destino = destino.slice(1, -1);
  try {
    destino = decodeURIComponent(destino);
  } catch {
    // se queda como estaba
  }
  if (!destino || destino.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(destino)) return null;
  const ruta = normalizarRuta(base ? `${base}/${destino}` : destino);
  if (!ruta) return null;
  if (archivos.has(ruta)) return ruta;
  const minus = ruta.toLowerCase();
  for (const k of archivos.keys()) if (k.toLowerCase() === minus) return k;
  return null;
}

/** Busca por nombre (sin carpeta) cuando el respaldo no dice la ruta completa. */
export function buscarPorNombre(archivos: Archivos, nombre: string): string | null {
  const n = nombre.toLowerCase();
  for (const k of archivos.keys()) if (nombreDe(k).toLowerCase() === n) return k;
  return null;
}

// ── ZIP ──────────────────────────────────────────────────────────────────────

export const esZip = (b: Uint8Array) => b.length > 3 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;

/** Abre un ZIP. Descarta `__MACOSX`, carpetas y archivos ocultos; con una sola carpeta madre la quita (como moodiary `_resolveRoot`). */
export function leerZip(bytes: Uint8Array): Archivos {
  let crudo: Record<string, Uint8Array>;
  try {
    crudo = unzipSync(bytes);
  } catch {
    throw new ImportacionError("El archivo ZIP está dañado o no se puede abrir");
  }
  const lista: [string, Uint8Array][] = [];
  for (const [ruta, datos] of Object.entries(crudo)) {
    const r = normalizarRuta(ruta);
    if (!r || ruta.endsWith("/") || r.startsWith("__MACOSX/") || r.split("/").some((p) => p.startsWith("."))) continue;
    lista.push([r, datos]);
  }
  const primeras = new Set(lista.map(([r]) => r.split("/")[0]));
  const unaCarpeta = primeras.size === 1 && lista.every(([r]) => r.includes("/"));
  return new Map(unaCarpeta ? lista.map(([r, d]) => [r.slice(r.indexOf("/") + 1), d]) : lista);
}

// ── CSV (RFC 4180) ───────────────────────────────────────────────────────────

export function leerCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entre = false;
  const s = texto.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (entre) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          celda += '"';
          i++;
        } else entre = false;
      } else celda += c;
    } else if (c === '"') entre = true;
    else if (c === ",") {
      fila.push(celda);
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else celda += c;
  }
  if (celda !== "" || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}

// ── XML mínimo (el respaldo de Diaro: <table name="x"><r><campo>texto</campo></r></table>) ──

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodificarEntidades(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (todo, e: string) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : todo;
    }
    return ENTIDADES[e.toLowerCase()] ?? todo;
  });
}

const valorXml = (s: string) => {
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(s);
  return cdata ? cdata[1] : decodificarEntidades(s);
};

/** Tablas del respaldo de Diaro: nombre → filas (campo → texto). */
export function leerTablasXml(xml: string): Map<string, Record<string, string>[]> {
  const tablas = new Map<string, Record<string, string>[]>();
  for (const t of xml.matchAll(/<table\b[^>]*\bname\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/table>/g)) {
    const filas: Record<string, string>[] = [];
    for (const r of t[2].matchAll(/<r\b[^>]*>([\s\S]*?)<\/r>/g)) {
      const fila: Record<string, string> = {};
      for (const c of r[1].matchAll(/<([A-Za-z_][\w.-]*)\b[^>]*?(?:\/>|>([\s\S]*?)<\/\1>)/g)) fila[c[1]] = valorXml(c[2] ?? "");
      filas.push(fila);
    }
    tablas.set(decodificarEntidades(t[1]), filas);
  }
  return tablas;
}
