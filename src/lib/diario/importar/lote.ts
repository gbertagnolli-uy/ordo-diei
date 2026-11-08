// Diario (lane 292): lo que viaja del navegador al servidor, por lotes (decisión I1: el límite del cuerpo de una función en Vercel es 4,5 MB).
import { clasificarAdjunto } from "../adjuntos.ts";
import type { Clima } from "../clima.ts";
import { textoPlanoDe, type NodoDoc } from "../contenido.ts";
import { reescribirImagenes } from "../exportar.ts";
import type { LugarImport } from "../lugares.ts";
import { MAX_FOTOS } from "../reglas.ts";
import { nombreDe } from "./comun.ts";
import { MARCADOR_ARCHIVO, MARCADOR_IMAGEN, type EntradaImport, type EtiquetaPuestaImport } from "./tipos.ts";

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
  lugar: LugarImport | null;
  clima: Clima | null;
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

/** El bloque de un audio, video o documento ya subido (lane 294). El tipo sale de la extensión del archivo de origen. */
export function bloqueDeArchivo(url: string, ruta: string, nombre: string | null, bytes: number | null): NodoDoc {
  const archivo = nombreDe(ruta);
  const tipo = clasificarAdjunto(archivo, "");
  const rotulo = (nombre?.trim() || archivo).slice(0, 200);
  if (tipo?.categoria === "audio") return { type: "audio", attrs: { src: url, name: rotulo.replace(/\.[^.]{1,16}$/, "") } };
  if (tipo?.categoria === "video") return { type: "video", attrs: { src: url, name: rotulo } };
  return { type: "attachment", attrs: { src: url, name: rotulo, mime: tipo?.mime ?? null, size: bytes } };
}

/**
 * Cambia los enlaces a `MARCADOR_ARCHIVO` + N del documento: un párrafo que es solo ese enlace pasa a ser el bloque del archivo; en medio de un texto
 * queda el rótulo sin enlace. Si el archivo no se pudo subir (`resolver` devuelve `null`) queda solo el rótulo.
 */
export function colocarArchivos(doc: NodoDoc, resolver: (n: number) => { url: string | null; ruta: string; bytes: number | null }): NodoDoc {
  const numeroDe = (n: NodoDoc): number | null => {
    const href = n.type === "text" ? n.marks?.find((m) => m.type === "link")?.attrs?.href : undefined;
    return typeof href === "string" && href.startsWith(MARCADOR_ARCHIVO) && /^\d+$/.test(href.slice(MARCADOR_ARCHIVO.length)) ? Number(href.slice(MARCADOR_ARCHIVO.length)) : null;
  };
  const sinEnlace = (n: NodoDoc): NodoDoc => {
    if (numeroDe(n) === null) return n;
    const marcas = (n.marks ?? []).filter((m) => m.type !== "link");
    const copia: NodoDoc = { ...n };
    if (marcas.length) copia.marks = marcas;
    else delete copia.marks;
    return copia;
  };
  const recorrer = (n: NodoDoc): NodoDoc[] => {
    if (n.type === "paragraph" && n.content?.length === 1) {
      const numero = numeroDe(n.content[0]);
      if (numero !== null) {
        const { url, ruta, bytes } = resolver(numero);
        return url ? [bloqueDeArchivo(url, ruta, n.content[0].text ?? null, bytes)] : [{ ...n, content: [sinEnlace(n.content[0])] }];
      }
    }
    if (n.type === "text") return [sinEnlace(n)];
    return [n.content ? { ...n, content: n.content.flatMap(recorrer) } : n];
  };
  return recorrer(doc)[0] ?? doc;
}

/**
 * Pone las URLs de las fotos ya subidas (`urls`: ruta del archivo → URL, o null si no se pudo subir) y convierte el Markdown en documento.
 * Las fotos de más de `MAX_FOTOS` pasan al final del documento como imágenes.
 */
export function entradaALote(e: EntradaImport, urls: Map<string, string | null>, convertir: (markdown: string) => NodoDoc | null, tamanos: Map<string, number> = new Map()): EntradaLote {
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
  // Lane 294: los documentos que el Markdown enlaza pasan a ser bloques del archivo ya subido
  if (doc && !e.contenido) doc = colocarArchivos(doc, (n) => ({ url: urlDe(e.imagenes[n]), ruta: e.imagenes[n] ?? "", bytes: tamanos.get(e.imagenes[n] ?? "") ?? null }));
  const fotos = e.fotos.map(urlDe).filter(NO_NULO);
  const sobran = fotos.slice(MAX_FOTOS);
  // Audios y videos que la app de origen guarda aparte (Daily You) van al final del documento
  const aparte = e.adjuntos.flatMap((ruta): NodoDoc[] => {
    const url = urlDe(ruta);
    return url ? [bloqueDeArchivo(url, ruta, null, tamanos.get(ruta) ?? null)] : [];
  });
  if (sobran.length || aparte.length) doc = { type: "doc", content: [...(doc?.content ?? []), ...sobran.map((src): NodoDoc => ({ type: "image", attrs: { src } })), ...aparte] };
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
    lugar: e.lugar,
    clima: e.clima,
    favorita: e.favorita,
    fijada: e.fijada,
    fotos: fotos.slice(0, MAX_FOTOS),
  };
}
