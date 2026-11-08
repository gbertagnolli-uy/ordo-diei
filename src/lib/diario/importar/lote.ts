// Diario (lane 292): lo que viaja del navegador al servidor, por lotes (decisión I1: el límite del cuerpo de una función en Vercel es 4,5 MB).
import { textoPlanoDe, type NodoDoc } from "../contenido.ts";
import { reescribirImagenes } from "../exportar.ts";
import { MAX_FOTOS } from "../reglas.ts";
import { MARCADOR_IMAGEN, type EntradaImport, type EtiquetaPuestaImport } from "./tipos.ts";

export const MAX_ENTRADAS_LOTE = 25;
export const MAX_BYTES_LOTE = 2_500_000;

/** Una entrada lista para escribir: el cuerpo ya es un documento y las fotos ya son URLs `/api/archivos/…`. */
export interface EntradaLote {
  fecha: string | null;
  hora: number | null;
  instante: string | null;
  titulo: string | null;
  /** Texto plano de respaldo si no hay documento. */
  texto: string;
  contenido: NodoDoc | null;
  animo: number | null;
  categoria: string | null;
  etiquetas: EtiquetaPuestaImport[];
  favorita: boolean;
  fijada: boolean;
  fotos: string[];
}

export interface RechazoLote {
  /** Posición dentro del lote. */
  indice: number;
  motivo: string;
}

export interface ResultadoLote {
  creadas: number;
  duplicadas: number;
  rechazadas: RechazoLote[];
}

export interface ResultadoCatalogo {
  grupos: number;
  etiquetas: number;
  categorias: number;
  avisos: string[];
}

/** Parte la lista en lotes de hasta `maxItems` elementos y `maxBytes` (el tamaño lo da `peso`). Un elemento más grande que el tope va solo. */
export function partirEnLotes<T>(items: T[], peso: (t: T) => number, maxItems = MAX_ENTRADAS_LOTE, maxBytes = MAX_BYTES_LOTE): T[][] {
  const lotes: T[][] = [];
  let actual: T[] = [];
  let bytes = 0;
  for (const it of items) {
    const p = peso(it);
    if (actual.length && (actual.length >= maxItems || bytes + p > maxBytes)) {
      lotes.push(actual);
      actual = [];
      bytes = 0;
    }
    actual.push(it);
    bytes += p;
  }
  if (actual.length) lotes.push(actual);
  return lotes;
}

// ── De una entrada leída a una entrada del lote ──────────────────────────────

const NO_NULO = <T>(x: T | null | undefined): x is T => x !== null && x !== undefined;
/** `![alt](imagen://N)` (es `MARCADOR_IMAGEN` seguido del número). */
const RE_MARCADOR_MD = /!\[([^\]]*)\]\(imagen:\/\/(\d+)\)/g;

/**
 * Pone las URLs de las fotos ya subidas (`urls`: ruta del archivo → URL, o null si no se pudo subir) y convierte el Markdown en documento.
 * Las fotos de más de `MAX_FOTOS` pasan al final del documento como imágenes.
 */
export function entradaALote(e: EntradaImport, urls: Map<string, string | null>, convertir: (markdown: string) => NodoDoc | null): EntradaLote {
  const urlDe = (ruta: string | undefined) => (ruta === undefined ? null : (urls.get(ruta) ?? null));
  const urlDeMarcador = (n: number) => urlDe(e.imagenes[n]);
  const markdown = e.markdown.replace(RE_MARCADOR_MD, (_t, alt: string, n: string) => {
    const u = urlDeMarcador(Number(n));
    return u ? `![${alt}](${u})` : "";
  });
  let doc: NodoDoc | null = e.contenido
    ? reescribirImagenes(e.contenido, (src) => (src.startsWith(MARCADOR_IMAGEN) ? urlDeMarcador(Number(src.slice(MARCADOR_IMAGEN.length))) : src))
    : markdown.trim()
      ? convertir(markdown)
      : null;
  const fotos = e.fotos.map(urlDe).filter(NO_NULO);
  const sobran = fotos.slice(MAX_FOTOS);
  if (sobran.length) doc = { type: "doc", content: [...(doc?.content ?? []), ...sobran.map((src): NodoDoc => ({ type: "image", attrs: { src } }))] };
  return {
    fecha: e.fecha,
    hora: e.hora,
    instante: e.instante,
    titulo: e.titulo,
    texto: doc ? textoPlanoDe(doc) : markdown.trim(),
    contenido: doc,
    animo: e.animo,
    categoria: e.categoria,
    etiquetas: e.etiquetas,
    favorita: e.favorita,
    fijada: e.fijada,
    fotos: fotos.slice(0, MAX_FOTOS),
  };
}
