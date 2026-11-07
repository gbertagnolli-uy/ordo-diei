// Biblioteca (lane 270): reglas puras. El orden natural está portado de
// vendor/bookorbit/server/src/common/utils/natural-sort.utils.ts y el de pistas de
// vendor/bookorbit/server/src/common/utils/book-media.utils.ts (compareAudioTracks) (bookorbit/bookorbit@6ad1445).
// Los estados de lectura son los de BookOrbit reducidos a tres (vault LANE_270, D3).

export type Formato = "epub" | "pdf" | "mobi" | "azw" | "azw3" | "cbz" | "cbr" | "fb2" | "mp3" | "m4b" | "m4a" | "ogg";
export type EstadoBiblioteca = "sin_empezar" | "leyendo" | "leido";

export const FORMATOS: Record<Formato, { audio: boolean; mimes: string[] }> = {
  epub: { audio: false, mimes: ["application/epub+zip"] },
  pdf: { audio: false, mimes: ["application/pdf"] },
  mobi: { audio: false, mimes: ["application/x-mobipocket-ebook"] },
  azw: { audio: false, mimes: ["application/vnd.amazon.ebook"] },
  azw3: { audio: false, mimes: ["application/vnd.amazon.mobi8-ebook", "application/x-mobi8-ebook"] },
  cbz: { audio: false, mimes: ["application/vnd.comicbook+zip", "application/x-cbz"] },
  cbr: { audio: false, mimes: ["application/vnd.comicbook-rar", "application/x-cbr", "application/vnd.rar", "application/x-rar-compressed"] },
  fb2: { audio: false, mimes: ["application/x-fictionbook+xml", "application/x-fb2", "text/fb2+xml"] },
  mp3: { audio: true, mimes: ["audio/mpeg", "audio/mp3"] },
  m4b: { audio: true, mimes: ["audio/x-m4b", "audio/m4b"] },
  m4a: { audio: true, mimes: ["audio/mp4", "audio/x-m4a", "audio/m4a"] },
  ogg: { audio: true, mimes: ["audio/ogg"] },
};

const ESTADOS: readonly EstadoBiblioteca[] = ["sin_empezar", "leyendo", "leido"];
export const esEstado = (v: unknown): v is EstadoBiblioteca => typeof v === "string" && (ESTADOS as readonly string[]).includes(v);
export const esFormato = (v: unknown): v is Formato => typeof v === "string" && v in FORMATOS;
export const esAudio = (f: Formato) => FORMATOS[f].audio;

/** Porcentaje desde el que un libro cuenta como leído sin marcarlo a mano (D3). */
export const UMBRAL_LEIDO = 98;

/** Formato por la extensión del nombre; si no la tiene o no se conoce, por el tipo MIME. */
export function formatoDe(nombre: string, mime?: string | null): Formato | null {
  const ext = nombre.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (esFormato(ext)) return ext;
  const m = (mime ?? "").toLowerCase().split(";")[0].trim();
  for (const [f, def] of Object.entries(FORMATOS) as [Formato, (typeof FORMATOS)[Formato]][]) {
    if (def.mimes.includes(m)) return f;
  }
  return null;
}

/**
 * Estado después de guardar una posición (D3). Si el usuario elige un estado a mano, vale ese.
 * Si no: un libro leído sigue leído; ≥ 98 % pasa a leído; > 0 % pasa a leyendo; si no, queda como estaba.
 */
export function siguienteEstado(actual: EstadoBiblioteca, porcentaje: number, manual?: EstadoBiblioteca | null): EstadoBiblioteca {
  if (manual) return manual;
  if (actual === "leido") return "leido";
  if (porcentaje >= UMBRAL_LEIDO) return "leido";
  if (porcentaje > 0) return "leyendo";
  return actual;
}

/** Orden natural: «Cap 2» antes que «Cap 10» (portado de naturalCompare de BookOrbit). */
export function compararNatural(a: string, b: string): number {
  const numeros = /(\d+)/;
  const pa = a.split(numeros);
  const pb = b.split(numeros);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? "";
    const y = pb[i] ?? "";
    if (/^\d+$/.test(x) && /^\d+$/.test(y)) {
      const d = Number.parseInt(x, 10) - Number.parseInt(y, 10);
      if (d !== 0) return d;
    } else {
      const d = x.localeCompare(y);
      if (d !== 0) return d;
    }
  }
  return 0;
}

/** Pistas de un audiolibro en orden de reproducción: primero por `orden`, después orden natural por título o URL. */
export function ordenarPistas<T extends { orden: number; titulo: string | null; url: string }>(archivos: readonly T[]): T[] {
  return [...archivos].sort((a, b) => a.orden - b.orden || compararNatural(a.titulo ?? a.url, b.titulo ?? b.url));
}

/** Minúsculas y sin tildes, para buscar «perez» y encontrar «Pérez». */
export function sinTildes(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export type FiltroBiblioteca = {
  texto?: string;
  tipo?: "libros" | "audiolibros" | null;
  estado?: EstadoBiblioteca | null;
  estanteId?: number | null;
};

export function filtrarLibros<T extends { titulo: string; autor: string | null; esAudiolibro: boolean; estado: EstadoBiblioteca; estanteIds: number[] }>(
  libros: readonly T[],
  filtro: FiltroBiblioteca,
): T[] {
  const q = sinTildes((filtro.texto ?? "").trim());
  return libros.filter(
    (l) =>
      (!q || sinTildes(`${l.titulo} ${l.autor ?? ""}`).includes(q)) &&
      (!filtro.tipo || (filtro.tipo === "audiolibros") === l.esAudiolibro) &&
      (!filtro.estado || l.estado === filtro.estado) &&
      (filtro.estanteId == null || l.estanteIds.includes(filtro.estanteId)),
  );
}

export type ArchivoValido = { url: string; formato: Formato; bytes: number | null; orden: number; titulo: string | null; duracionSeg: number | null };
export type LibroValido = {
  titulo: string;
  autor: string | null;
  sinopsis: string | null;
  portadaUrl: string | null;
  estanteIds: number[];
  archivos: ArchivoValido[] | null; // null = no se cambian (al editar)
  esAudiolibro: boolean | null; // null = no se cambia (al editar)
};

const texto = (v: unknown, campo: string, max: number, obligatorio = false): string | null => {
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
    if (obligatorio) throw new Error(`Falta ${campo}`);
    return null;
  }
  if (typeof v !== "string") throw new Error(`${campo} inválido`);
  const t = v.trim();
  if (t.length > max) throw new Error(`${campo} es demasiado largo (máximo ${max} caracteres)`);
  return t;
};

/**
 * URL de un archivo propio: los de `/api/upload` (≤ 4 MB, vienen como `/api/archivos/<uuid>?tipo=pdf&nombre=…`)
 * o, cuando exista, los de LANE_277.
 */
export const esUrlArchivo = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 1000 && /^\/api\/(archivos|almacen)\/[A-Za-z0-9._\-/]+(\?[^\s#]*)?$/.test(v);

/**
 * Valida lo que manda la pantalla de gestión. Al crear (`conArchivos`), hace falta al menos un archivo;
 * un libro es audiolibro si todos sus archivos son de audio, y no se mezclan audio y texto.
 */
export function validarLibro(entrada: Record<string, unknown>, { conArchivos }: { conArchivos: boolean }): LibroValido {
  const titulo = texto(entrada.titulo, "el título", 200, true)!;
  const autor = texto(entrada.autor, "el autor", 200);
  const sinopsis = texto(entrada.sinopsis, "la sinopsis", 5000);
  const portadaUrl = entrada.portadaUrl === undefined || entrada.portadaUrl === null || entrada.portadaUrl === "" ? null : entrada.portadaUrl;
  if (portadaUrl !== null && !esUrlArchivo(portadaUrl)) throw new Error("La portada no es un archivo subido");

  const ids = entrada.estanteIds ?? [];
  if (!Array.isArray(ids) || ids.some((n) => !Number.isInteger(n) || n <= 0)) throw new Error("Estantes inválidos");
  const estanteIds = [...new Set(ids as number[])];

  if (!conArchivos) return { titulo, autor, sinopsis, portadaUrl, estanteIds, archivos: null, esAudiolibro: null };

  const lista = entrada.archivos;
  if (!Array.isArray(lista) || lista.length === 0) throw new Error("Falta el archivo del libro");
  if (lista.length > 200) throw new Error("Demasiados archivos");
  const archivos: ArchivoValido[] = lista.map((a, i) => {
    const o = (a ?? {}) as Record<string, unknown>;
    if (!esUrlArchivo(o.url)) throw new Error("Archivo inválido");
    if (!esFormato(o.formato)) throw new Error("Formato no admitido (ePub, PDF, mobi, azw, azw3, cbz, cbr, fb2, mp3, m4b, m4a u ogg)");
    const bytes = Number.isInteger(o.bytes) && (o.bytes as number) >= 0 ? (o.bytes as number) : null;
    const duracionSeg = Number.isInteger(o.duracionSeg) && (o.duracionSeg as number) >= 0 ? (o.duracionSeg as number) : null;
    return { url: o.url, formato: o.formato, bytes, orden: i, titulo: texto(o.titulo, "el título de la pista", 200), duracionSeg };
  });
  const audio = archivos.filter((a) => esAudio(a.formato)).length;
  if (audio > 0 && audio < archivos.length) throw new Error("Un libro no puede mezclar audio y texto");
  if (audio === 0 && archivos.length > 1) throw new Error("Un libro de texto lleva un solo archivo");
  return { titulo, autor, sinopsis, portadaUrl, estanteIds, archivos, esAudiolibro: audio > 0 };
}

/** Porcentaje entre 0 y 100 (lo que mande el lector). */
export function porcentajeValido(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error("Porcentaje inválido");
  return Math.min(100, Math.max(0, n));
}
