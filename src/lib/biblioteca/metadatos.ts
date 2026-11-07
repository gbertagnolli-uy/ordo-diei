// Extracción de metadatos y portada de archivos de libros y audiolibros (lane 281).
// Portado de BookOrbit (bookorbit/bookorbit@6ad1445: server/src/modules/metadata/lib/{epub.ts,opf-parser.ts,
// cover-epub.ts,mobi-parser.ts,fb2-parser.ts,cover-fb2.ts,cbz-metadata.ts,cover-cbz.ts,cover-cbr.ts,
// pdf-parser.ts,pdf-xmp-reader.ts,filename-parser.ts} y server/src/common/{cbz-zip-reader.ts,
// comic-format-detect.ts,archive-entry-sort.ts,utils/fb2-encoding.utils.ts}) y Homebranch
// (Oghamark/homebranch: homebranch-api/src/modules/book/format/pdf-parser.service.ts).
// Puro sobre Buffer en Node (zlib + sharp), sin binarios externos para funcionar en Vercel serverless.

import { inflateRawSync, inflateSync } from "node:zlib";
import sharp from "sharp";
import type { Formato } from "./reglas";

export type MetadatosLibro = {
  titulo: string | null;
  autor: string | null;
  sinopsis: string | null;
  portada: Buffer | null;
};

const COLLATOR_ARCHIVO = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const EXTENSIONES_IMAGEN = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);
const ARTEFACTO_ARCHIVO_RE = /\.(epub|pdf|mobi|azw3?|fb2|cbz|cbr|cb7|txt|docx?|rtf|html?)$/i;

/** Detecta si un buffer comienza con los magic bytes de una imagen soportada (JPEG, PNG, GIF, WebP, BMP). */
export function esImagenBuffer(buf: Buffer | null | undefined): buf is Buffer {
  if (!buf || buf.length < 4) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true; // PNG
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true; // GIF
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return true; // WebP
  }
  if (buf[0] === 0x42 && buf[1] === 0x4d && buf.length >= 14) return true; // BMP
  return false;
}

/** Decodifica entidades HTML/XML habituales (incluyendo HTML escapado dentro de XML como en OPF) y quita etiquetas dejando texto plano. */
export function htmlATextoPlano(html: string | null | undefined): string | null {
  if (!html) return null;
  const desescapado = decodificarEntidadesXml(html);
  const sinEtiquetas = desescapado
    .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  const decodificado = decodificarEntidadesXml(sinEtiquetas).replace(/<[^>]+>/g, "");
  const limpio = decodificado
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return limpio || null;
}

function decodificarEntidadesXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : "";
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : "";
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function esTituloArtefacto(titulo: string | null | undefined): boolean {
  if (!titulo) return true;
  const t = titulo.trim();
  if (!t) return true;
  if (ARTEFACTO_ARCHIVO_RE.test(t)) return true;
  if (/^(untitled|sin t[íi]tulo|documento convertido|converted document|unknown|desconocido|microsoft word\s*-\s*)$/i.test(t)) return true;
  return false;
}

function limpiarAutorExtraido(autor: string | null | undefined): string | null {
  if (!autor) return null;
  const a = decodificarEntidadesXml(autor).replace(/\s+/g, " ").trim();
  if (a.length <= 1 || /^\d+$/.test(a)) return null;
  if (/^(unknown|desconocido|an[óo]nimo|none|n\/a|null|undefined)$/i.test(a)) return null;
  return a.slice(0, 200);
}

function limpiarTituloExtraido(titulo: string | null | undefined): string | null {
  if (!titulo) return null;
  let t = decodificarEntidadesXml(titulo).replace(/\s+/g, " ").trim();
  t = t.replace(/^Microsoft Word\s*-\s*/i, "").trim();
  if (ARTEFACTO_ARCHIVO_RE.test(t)) return null;
  if (esTituloArtefacto(t)) return null;
  return t.slice(0, 200) || null;
}

/**
 * Portado de BookOrbit `parseBookFilename` (`filename-parser.ts`) + convención Calibre/Anna's Archive (`Título -- Autor`).
 */
export function parsearNombreArchivo(nombreArchivo: string): { titulo: string; autor: string | null } {
  const base = nombreArchivo.split(/[/\\]/).pop() ?? nombreArchivo;
  let stem = base.replace(/\.[a-z0-9]{2,5}$/i, "").trim();
  if (!stem) return { titulo: "Libro", autor: null };

  // Si no hay espacios pero sí guiones bajos, convierte guiones bajos en espacios
  if (!stem.includes(" ") && stem.includes("_")) {
    stem = stem.replace(/_+/g, " ").trim();
  }

  // Quita bloques [Serie #1] o [ hash ]
  stem = stem.replace(/\s*\[[^\]]*\]\s*/g, " ").replace(/\s+/g, " ").trim();

  // Quita sufijo (1999) o (2024)
  stem = stem.replace(/\s*\((1[5-9]\d\d|20\d\d)\)\s*$/, "").trim();

  // Convención «Título -- Autor [-- Editorial/Hash]»
  if (stem.includes(" -- ")) {
    const partes = stem.split(/\s+--\s+/).map((p) => p.trim()).filter(Boolean);
    if (partes.length >= 2) {
      const titulo = partes[0];
      const candidatoAutor = partes[1];
      const esHashOAno = /^[0-9a-f]{16,}$/i.test(candidatoAutor) || /^\d{3,4}$/.test(candidatoAutor);
      return {
        titulo: (titulo || stem).slice(0, 200),
        autor: !esHashOAno && candidatoAutor ? candidatoAutor.slice(0, 200) : null,
      };
    }
  }

  // Convención «Autor - Título» (salvo cuando la derecha es un año como «Vulgata Clementina - 1598» o «Cap 1»)
  const guionIdx = stem.indexOf(" - ");
  if (guionIdx > 0) {
    const izq = stem.slice(0, guionIdx).trim();
    const der = stem.slice(guionIdx + 3).trim();
    if (izq && der) {
      if (/^\d{3,4}$/.test(der)) {
        return { titulo: `${izq} (${der})`.slice(0, 200), autor: null };
      }
      return { titulo: der.slice(0, 200), autor: izq.slice(0, 200) };
    }
  }

  return { titulo: stem.slice(0, 200), autor: null };
}

// ── Lector ZIP en memoria (portado de BookOrbit cbz-zip-reader.ts) ────────────

const EOCD_SIG = 0x06054b50;
const CDFH_SIG = 0x02014b50;
const LFH_SIG = 0x04034b50;
const ZIP64_EOCD_LOCATOR_SIG = 0x07064b50;
const ZIP64_EOCD_SIG = 0x06064b50;
const ZIP64_EXTRA_FIELD_ID = 0x0001;
const UINT32_MAX = 0xffffffff;
const UINT16_MAX = 0xffff;
const MAX_EOCD_SEARCH = 65_535 + 22;

export type EntradaZip = {
  nombre: string;
  compresion: number;
  tamanoComprimido: number;
  tamanoDescomprimido: number;
  offsetCabeceraLocal: number;
  inicioDatos: number;
};

export type IndiceZip = {
  entradas: EntradaZip[];
  comentario: string | null;
};

function esZipBuffer(buf: Buffer): boolean {
  return (
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    ((buf[2] === 0x03 && buf[3] === 0x04) || (buf[2] === 0x05 && buf[3] === 0x06))
  );
}

function esRarBuffer(buf: Buffer): boolean {
  return (
    buf.length >= 7 &&
    buf[0] === 0x52 &&
    buf[1] === 0x61 &&
    buf[2] === 0x72 &&
    buf[3] === 0x21 &&
    buf[4] === 0x1a &&
    buf[5] === 0x07 &&
    (buf[6] === 0x00 || (buf.length >= 8 && buf[6] === 0x01 && buf[7] === 0x00))
  );
}

function leerUInt64Seguro(buf: Buffer, offset: number): number | null {
  if (offset + 8 > buf.length) return null;
  const val = buf.readBigUInt64LE(offset);
  if (val > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(val);
}

function buscarZip64Extra(extra: Buffer): Buffer | null {
  let pos = 0;
  while (pos + 4 <= extra.length) {
    const id = extra.readUInt16LE(pos);
    const size = extra.readUInt16LE(pos + 2);
    const start = pos + 4;
    const end = start + size;
    if (end > extra.length) return null;
    if (id === ZIP64_EXTRA_FIELD_ID) return extra.subarray(start, end);
    pos = end;
  }
  return null;
}

export function leerIndiceZip(buf: Buffer): IndiceZip | null {
  if (buf.length < 22 || !esZipBuffer(buf)) return null;
  const minPos = Math.max(0, buf.length - MAX_EOCD_SEARCH);
  let eocdPos = -1;
  let commentLen = 0;
  for (let pos = buf.length - 22; pos >= minPos; pos--) {
    if (buf.readUInt32LE(pos) !== EOCD_SIG) continue;
    const cLen = buf.readUInt16LE(pos + 20);
    if (pos + 22 + cLen === buf.length) {
      eocdPos = pos;
      commentLen = cLen;
      break;
    }
  }
  if (eocdPos < 0) return null;

  let cdSize = buf.readUInt32LE(eocdPos + 12);
  let cdOffset = buf.readUInt32LE(eocdPos + 16);
  const totalEntries = buf.readUInt16LE(eocdPos + 10);
  const comentario = commentLen > 0 ? buf.subarray(eocdPos + 22, eocdPos + 22 + commentLen).toString("utf8") : null;

  if (cdSize === UINT32_MAX || cdOffset === UINT32_MAX || totalEntries === UINT16_MAX) {
    if (eocdPos < 20 || buf.readUInt32LE(eocdPos - 20) !== ZIP64_EOCD_LOCATOR_SIG) return null;
    const z64Offset = leerUInt64Seguro(buf, eocdPos - 12);
    if (z64Offset == null || z64Offset + 56 > buf.length || buf.readUInt32LE(z64Offset) !== ZIP64_EOCD_SIG) return null;
    const s = leerUInt64Seguro(buf, z64Offset + 40);
    const o = leerUInt64Seguro(buf, z64Offset + 48);
    if (s == null || o == null) return null;
    cdSize = s;
    cdOffset = o;
  }

  if (cdOffset < 0 || cdSize < 0 || cdOffset + cdSize > buf.length) return null;
  const entradas: EntradaZip[] = [];
  const cdEnd = cdOffset + cdSize;
  let pos = cdOffset;

  while (pos + 46 <= cdEnd) {
    if (buf.readUInt32LE(pos) !== CDFH_SIG) break;
    const compresion = buf.readUInt16LE(pos + 10);
    let tamanoComprimido = buf.readUInt32LE(pos + 20);
    let tamanoDescomprimido = buf.readUInt32LE(pos + 24);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commLen = buf.readUInt16LE(pos + 32);
    let offsetCabeceraLocal = buf.readUInt32LE(pos + 42);
    const nextPos = pos + 46 + nameLen + extraLen + commLen;
    if (nextPos > cdEnd) break;

    const nombre = buf.subarray(pos + 46, pos + 46 + nameLen).toString("utf8");
    const extra = buf.subarray(pos + 46 + nameLen, pos + 46 + nameLen + extraLen);

    if (tamanoDescomprimido === UINT32_MAX || tamanoComprimido === UINT32_MAX || offsetCabeceraLocal === UINT32_MAX) {
      const z64 = buscarZip64Extra(extra);
      if (!z64) {
        pos = nextPos;
        continue;
      }
      let zPos = 0;
      if (tamanoDescomprimido === UINT32_MAX) {
        const v = leerUInt64Seguro(z64, zPos);
        if (v == null) break;
        tamanoDescomprimido = v;
        zPos += 8;
      }
      if (tamanoComprimido === UINT32_MAX) {
        const v = leerUInt64Seguro(z64, zPos);
        if (v == null) break;
        tamanoComprimido = v;
        zPos += 8;
      }
      if (offsetCabeceraLocal === UINT32_MAX) {
        const v = leerUInt64Seguro(z64, zPos);
        if (v == null) break;
        offsetCabeceraLocal = v;
      }
    }

    if (offsetCabeceraLocal + 30 <= buf.length && buf.readUInt32LE(offsetCabeceraLocal) === LFH_SIG) {
      const lfhNameLen = buf.readUInt16LE(offsetCabeceraLocal + 26);
      const lfhExtraLen = buf.readUInt16LE(offsetCabeceraLocal + 28);
      const inicioDatos = offsetCabeceraLocal + 30 + lfhNameLen + lfhExtraLen;
      if (inicioDatos + tamanoComprimido <= buf.length) {
        entradas.push({
          nombre,
          compresion,
          tamanoComprimido,
          tamanoDescomprimido,
          offsetCabeceraLocal,
          inicioDatos,
        });
      }
    }
    pos = nextPos;
  }

  return { entradas, comentario };
}

export function extraerEntradaZip(buf: Buffer, entrada: EntradaZip): Buffer | null {
  try {
    if (entrada.inicioDatos + entrada.tamanoComprimido > buf.length) return null;
    const raw = buf.subarray(entrada.inicioDatos, entrada.inicioDatos + entrada.tamanoComprimido);
    if (entrada.compresion === 0) return Buffer.from(raw);
    if (entrada.compresion === 8) return inflateRawSync(raw);
    return null;
  } catch {
    return null;
  }
}

// ── Utilidades XML livianas ───────────────────────────────────────────────────

function parsearAtributosXml(apertura: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const m of apertura.matchAll(re)) {
    const clave = m[1];
    const valor = decodificarEntidadesXml(m[2] ?? m[3] ?? "");
    attrs[clave] = valor;
    const sinNs = clave.includes(":") ? clave.split(":").pop()! : clave;
    if (!(sinNs in attrs)) attrs[sinNs] = valor;
  }
  return attrs;
}

type NodoXml = {
  attrs: Record<string, string>;
  interior: string;
  texto: string;
};

function buscarElementosXml(xml: string, nombreLocal: string): NodoXml[] {
  const res: NodoXml[] = [];
  const esc = nombreLocal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<(?:[\\w.-]+:)?${esc}(\\s[^>]*?)?(?:\\/>|>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${esc}\\s*>)`, "gi");
  for (const m of xml.matchAll(re)) {
    const attrs = parsearAtributosXml(m[1] ?? "");
    const interior = m[2] ?? "";
    const texto = decodificarEntidadesXml(interior.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    res.push({ attrs, interior, texto });
  }
  return res;
}

// ── 1. Extractor ePub (portado de BookOrbit opf-parser.ts + cover-epub.ts) ───

function normalizarRutaZip(ruta: string): string {
  const partes: string[] = [];
  for (const p of ruta.replace(/\\/g, "/").split("/")) {
    if (!p || p === ".") continue;
    if (p === "..") partes.pop();
    else partes.push(p);
  }
  return partes.join("/");
}

function resolverRutaRelativaZip(dirBase: string, href: string): string {
  const limpio = href.split("#")[0].split("?")[0];
  let decodificado = limpio;
  try {
    decodificado = decodeURIComponent(limpio);
  } catch {
    decodificado = limpio;
  }
  return normalizarRutaZip(dirBase ? `${dirBase}/${decodificado}` : decodificado);
}

function buscarEntradaZipPorRuta(indice: IndiceZip, ruta: string): EntradaZip | undefined {
  const norm = normalizarRutaZip(ruta);
  return (
    indice.entradas.find((e) => normalizarRutaZip(e.nombre) === norm) ??
    indice.entradas.find((e) => normalizarRutaZip(e.nombre).toLowerCase() === norm.toLowerCase())
  );
}

function extraerImagenDeHtmlPortada(buf: Buffer, indice: IndiceZip, opfDir: string, htmlHref: string): Buffer | null {
  const htmlPath = resolverRutaRelativaZip(opfDir, htmlHref);
  const htmlEntry = buscarEntradaZipPorRuta(indice, htmlPath);
  if (!htmlEntry) return null;
  const htmlBytes = extraerEntradaZip(buf, htmlEntry);
  if (!htmlBytes) return null;
  const html = htmlBytes.toString("utf8");

  const imgMatch =
    html.match(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i) ??
    html.match(/<image\b[^>]*?\b(?:xlink:)?href\s*=\s*["']([^"']+)["']/i);
  if (!imgMatch?.[1]) return null;

  const htmlDir = htmlPath.includes("/") ? htmlPath.slice(0, htmlPath.lastIndexOf("/")) : "";
  const imgPath = resolverRutaRelativaZip(htmlDir, imgMatch[1]);
  const imgEntry = buscarEntradaZipPorRuta(indice, imgPath);
  if (!imgEntry) return null;
  const imgBuf = extraerEntradaZip(buf, imgEntry);
  return esImagenBuffer(imgBuf) ? imgBuf : null;
}

function extraerPortadaEpubDesdeOpf(buf: Buffer, indice: IndiceZip, opfDir: string, opfXml: string): Buffer | null {
  const items = buscarElementosXml(opfXml, "item");
  const metas = buscarElementosXml(opfXml, "meta");
  const refs = buscarElementosXml(opfXml, "reference");

  const esMediaImagen = (m: string | undefined, href: string | undefined) => {
    if (m?.toLowerCase().startsWith("image/")) return true;
    const h = (href ?? "").split("?")[0].split("#")[0].toLowerCase();
    return Array.from(EXTENSIONES_IMAGEN).some((ext) => h.endsWith(ext));
  };
  const esMediaHtml = (m: string | undefined, href: string | undefined) => {
    if (m && (m.includes("html") || m.includes("xml"))) return true;
    const h = (href ?? "").split("?")[0].split("#")[0].toLowerCase();
    return h.endsWith(".xhtml") || h.endsWith(".html") || h.endsWith(".htm");
  };

  const leerItem = (item: NodoXml | undefined): Buffer | null => {
    if (!item?.attrs.href) return null;
    if (esMediaImagen(item.attrs["media-type"], item.attrs.href)) {
      const entry = buscarEntradaZipPorRuta(indice, resolverRutaRelativaZip(opfDir, item.attrs.href));
      if (!entry) return null;
      const b = extraerEntradaZip(buf, entry);
      if (esImagenBuffer(b)) return b;
    }
    if (esMediaHtml(item.attrs["media-type"], item.attrs.href)) {
      return extraerImagenDeHtmlPortada(buf, indice, opfDir, item.attrs.href);
    }
    return null;
  };

  // 1. EPUB 3: <item properties="cover-image" href="..."/>
  const epub3Item = items.find((i) => (i.attrs.properties ?? "").split(/\s+/).includes("cover-image"));
  const c1 = leerItem(epub3Item);
  if (c1) return c1;

  // 2. EPUB 2: <meta name="cover" content="id"/>
  const metaCover = metas.find((m) => m.attrs.name?.toLowerCase() === "cover" && m.attrs.content);
  if (metaCover?.attrs.content) {
    const cid = metaCover.attrs.content;
    const item = items.find((i) => i.attrs.id === cid || i.attrs.href === cid);
    const c2 = leerItem(item);
    if (c2) return c2;
  }

  // 3. EPUB 2 Guide: <reference type="cover" href="..."/>
  const guideRef = refs.find((r) => r.attrs.type?.toLowerCase() === "cover" && r.attrs.href);
  if (guideRef?.attrs.href) {
    const refHref = guideRef.attrs.href.split("#")[0];
    const item = items.find((i) => i.attrs.href === refHref);
    const c3 = item ? leerItem(item) : extraerImagenDeHtmlPortada(buf, indice, opfDir, refHref);
    if (c3) return c3;
  }

  // 4. Fallback por id="cover" | "cover-image"
  const idItem = items.find((i) => {
    const id = i.attrs.id?.toLowerCase();
    return id === "cover" || id === "cover-image";
  });
  const c4 = leerItem(idItem);
  if (c4) return c4;

  // 5. Fallback por href o id que contenga "cover" o "portada" y sea imagen
  const hrefItem = items.find(
    (i) =>
      esMediaImagen(i.attrs["media-type"], i.attrs.href) &&
      (i.attrs.href?.toLowerCase().includes("cover") || i.attrs.id?.toLowerCase().includes("cover") || i.attrs.href?.toLowerCase().includes("portada")),
  );
  const c5 = leerItem(hrefItem);
  if (c5) return c5;

  // 6. Fallback al primer ítem del <spine> (muchos ePub ponen la portada en la primera página XHTML del spine)
  const primerItemref = buscarElementosXml(opfXml, "itemref")[0];
  if (primerItemref?.attrs.idref) {
    const spineItem = items.find((i) => i.attrs.id === primerItemref.attrs.idref);
    const c6 = leerItem(spineItem);
    if (c6) return c6;
  }

  return null;
}

function extraerEpub(buf: Buffer): MetadatosLibro | null {
  const indice = leerIndiceZip(buf);
  if (!indice) return null;

  let opfPath: string | null = null;
  const containerEntry = buscarEntradaZipPorRuta(indice, "META-INF/container.xml");
  if (containerEntry) {
    const containerXml = extraerEntradaZip(buf, containerEntry)?.toString("utf8") ?? "";
    const rootfiles = buscarElementosXml(containerXml, "rootfile");
    opfPath = rootfiles.find((r) => r.attrs["full-path"])?.attrs["full-path"] ?? null;
  }
  if (!opfPath) {
    opfPath = indice.entradas.find((e) => e.nombre.toLowerCase().endsWith(".opf"))?.nombre ?? null;
  }
  if (!opfPath) return null;

  const opfEntry = buscarEntradaZipPorRuta(indice, opfPath);
  if (!opfEntry) return null;
  const opfXml = extraerEntradaZip(buf, opfEntry)?.toString("utf8");
  if (!opfXml) return null;

  const opfNorm = normalizarRutaZip(opfPath);
  const opfDir = opfNorm.includes("/") ? opfNorm.slice(0, opfNorm.lastIndexOf("/")) : "";

  const metas = buscarElementosXml(opfXml, "meta");
  const refinesMap = new Map<string, Map<string, string>>();
  for (const m of metas) {
    const ref = m.attrs.refines?.replace(/^#/, "");
    const prop = m.attrs.property;
    if (ref && prop && m.texto) {
      if (!refinesMap.has(ref)) refinesMap.set(ref, new Map());
      refinesMap.get(ref)!.set(prop, m.texto);
    }
  }

  // Título y subtítulo (EPUB 2 y EPUB 3)
  const titleNodes = buscarElementosXml(opfXml, "title");
  let mainTitle: string | null = null;
  let subtitle: string | null = null;
  for (const t of titleNodes) {
    if (!t.texto) continue;
    const id = t.attrs.id;
    const titleType = id ? refinesMap.get(id)?.get("title-type") : undefined;
    if (titleType === "subtitle") {
      if (!subtitle) subtitle = limpiarTituloExtraido(t.texto);
    } else if (titleType === "main" || !mainTitle) {
      const limpio = limpiarTituloExtraido(t.texto);
      if (limpio) mainTitle = limpio;
    }
  }
  const titulo = mainTitle && subtitle && !mainTitle.includes(subtitle) ? `${mainTitle}: ${subtitle}`.slice(0, 200) : mainTitle;

  // Autores (<dc:creator>, priorizando rol "aut" o sin rol)
  const creatorNodes = buscarElementosXml(opfXml, "creator");
  const autoresPrincipales: string[] = [];
  const autoresTodos: string[] = [];
  for (const c of creatorNodes) {
    if (!c.texto) continue;
    autoresTodos.push(c.texto);
    const id = c.attrs.id;
    const role = (c.attrs.role ?? (id ? refinesMap.get(id)?.get("role") : undefined) ?? "").toLowerCase();
    if (!role || role === "aut" || role === "author") {
      autoresPrincipales.push(c.texto);
    }
  }
  const listaAutores = autoresPrincipales.length > 0 ? autoresPrincipales : autoresTodos;
  const autor = listaAutores.length > 0 ? [...new Set(listaAutores)].join(", ").slice(0, 200) : null;

  // Sinopsis (<dc:description>)
  const descNode = buscarElementosXml(opfXml, "description").find((d) => d.interior.trim());
  const sinopsis = descNode ? htmlATextoPlano(descNode.interior)?.slice(0, 5000) ?? null : null;

  // Portada
  const portada = extraerPortadaEpubDesdeOpf(buf, indice, opfDir, opfXml);

  return { titulo, autor, sinopsis, portada };
}

// ── 2. Extractor MOBI / AZW / AZW3 (portado de BookOrbit mobi-parser.ts) ─────

const EXTH_TIPO = {
  AUTOR: 100,
  DESCRIPCION: 103,
  TITULO_ACTUALIZADO: 503,
  OFFSET_PORTADA: 201,
  OFFSET_MINIATURA: 202,
} as const;

function extraerMobi(buf: Buffer): MetadatosLibro | null {
  if (esZipBuffer(buf)) return extraerEpub(buf);
  if (buf.length < 86) return null;

  const numRecords = buf.readUInt16BE(76);
  if (numRecords === 0 || 78 + numRecords * 8 > buf.length) return null;

  const offsets: number[] = [];
  for (let i = 0; i < numRecords; i++) {
    offsets.push(buf.readUInt32BE(78 + i * 8));
  }

  // En archivos combo KF8/AZW3 puede haber más de una cabecera MOBI; inspeccionamos primero el record 0
  const rec0Start = offsets[0];
  const rec0End = offsets[1] ?? buf.length;
  if (rec0Start >= buf.length || rec0End > buf.length || rec0End <= rec0Start) return null;
  const rec0 = buf.subarray(rec0Start, rec0End);

  if (rec0.length < 132 || rec0.subarray(16, 20).toString("ascii") !== "MOBI") {
    return null;
  }

  const mobiHeaderLength = rec0.readUInt32BE(20);
  const fullNameOffset = rec0.readUInt32BE(84);
  const fullNameLength = rec0.readUInt32BE(88);
  const firstImageIndex = rec0.readUInt32BE(108);
  const exthFlags = rec0.readUInt32BE(128);

  const palmTitle =
    fullNameLength > 0 && fullNameOffset + fullNameLength <= rec0.length
      ? rec0.subarray(fullNameOffset, fullNameOffset + fullNameLength).toString("utf8").replace(/\0+$/, "").trim()
      : null;

  const exthRecords: { tipo: number; datos: Buffer }[] = [];
  if ((exthFlags & 0x40) !== 0) {
    const exthStart = 16 + mobiHeaderLength;
    if (exthStart + 12 <= rec0.length && rec0.subarray(exthStart, exthStart + 4).toString("ascii") === "EXTH") {
      const recordCount = rec0.readUInt32BE(exthStart + 8);
      let pos = exthStart + 12;
      for (let i = 0; i < recordCount; i++) {
        if (pos + 8 > rec0.length) break;
        const tipo = rec0.readUInt32BE(pos);
        const length = rec0.readUInt32BE(pos + 4);
        if (length < 8 || pos + length > rec0.length) break;
        exthRecords.push({ tipo, datos: rec0.subarray(pos + 8, pos + length) });
        pos += length;
      }
    }
  }

  const exthTexto = (tipo: number): string | null => {
    const r = exthRecords.find((x) => x.tipo === tipo);
    return r ? r.datos.toString("utf8").replace(/\0+$/, "").trim() || null : null;
  };
  const exthTextos = (tipo: number): string[] =>
    exthRecords
      .filter((x) => x.tipo === tipo)
      .map((x) => x.datos.toString("utf8").replace(/\0+$/, "").trim())
      .filter(Boolean)
      .flatMap((v) => v.split(/\s*;\s*/).filter(Boolean));
  const exthUint32 = (tipo: number): number | null => {
    const r = exthRecords.find((x) => x.tipo === tipo);
    return r && r.datos.length >= 4 ? r.datos.readUInt32BE(0) : null;
  };

  const titulo = limpiarTituloExtraido(exthTexto(EXTH_TIPO.TITULO_ACTUALIZADO) ?? palmTitle);
  const autores = exthTextos(EXTH_TIPO.AUTOR);
  const autor = autores.length > 0 ? [...new Set(autores)].join(", ").slice(0, 200) : null;
  const rawDesc = exthTexto(EXTH_TIPO.DESCRIPCION);
  const sinopsis = rawDesc ? htmlATextoPlano(rawDesc)?.slice(0, 5000) ?? null : null;

  // Portada: primero por COVER_OFFSET (201) o THUMB_OFFSET (202), y si no, primera imagen desde firstImageIndex
  let portada: Buffer | null = null;
  const leerRecordImagen = (idx: number): Buffer | null => {
    if (idx < 0 || idx >= offsets.length) return null;
    const start = offsets[idx];
    const end = offsets[idx + 1] ?? buf.length;
    if (start >= buf.length || end > buf.length || end <= start) return null;
    const slice = Buffer.from(buf.subarray(start, end));
    return esImagenBuffer(slice) ? slice : null;
  };

  if (firstImageIndex < offsets.length) {
    const coverOffset = exthUint32(EXTH_TIPO.OFFSET_PORTADA) ?? exthUint32(EXTH_TIPO.OFFSET_MINIATURA);
    if (coverOffset != null && coverOffset !== UINT32_MAX) {
      portada = leerRecordImagen(firstImageIndex + coverOffset);
    }
    if (!portada) {
      const limite = Math.min(offsets.length, firstImageIndex + 30);
      for (let idx = firstImageIndex; idx < limite; idx++) {
        portada = leerRecordImagen(idx);
        if (portada) break;
      }
    }
  }

  return { titulo, autor, sinopsis, portada };
}

// ── 3. Extractor FB2 (portado de BookOrbit fb2-parser.ts + cover-fb2.ts) ─────

function decodificarFb2(buf: Buffer): string {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buf.subarray(2));
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buf.subarray(2));
  }
  const bomLen = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? 3 : 0;
  const cabecera = buf.subarray(bomLen, bomLen + 512).toString("latin1");
  const encMatch = cabecera.match(/<\?xml[^>]*?encoding\s*=\s*["']([^"']+)["'][^>]*\?>/i);
  const etiqueta = encMatch?.[1]?.trim().toLowerCase() ?? "utf-8";
  try {
    return new TextDecoder(etiqueta).decode(buf.subarray(bomLen));
  } catch {
    return buf.subarray(bomLen).toString("utf8");
  }
}

function extraerFb2(buf: Buffer): MetadatosLibro | null {
  let xmlBuf = buf;
  // Muchos FB2 se distribuyen comprimidos en ZIP (.fb2.zip renombrado a .fb2)
  if (esZipBuffer(buf)) {
    const idx = leerIndiceZip(buf);
    const fb2Entry = idx?.entradas.find((e) => e.nombre.toLowerCase().endsWith(".fb2")) ?? idx?.entradas[0];
    const extraido = fb2Entry ? extraerEntradaZip(buf, fb2Entry) : null;
    if (!extraido) return null;
    xmlBuf = extraido;
  }

  const xml = decodificarFb2(xmlBuf);
  if (!/<(?:\w+:)?FictionBook\b/i.test(xml)) return null;

  const descNode = buscarElementosXml(xml, "description")[0];
  const titleInfoNode = buscarElementosXml(descNode?.interior ?? xml, "title-info")[0];
  if (!titleInfoNode) return null;

  const tiXml = titleInfoNode.interior;
  const titulo = limpiarTituloExtraido(buscarElementosXml(tiXml, "book-title")[0]?.texto);

  // Autores (<author><first-name>, <middle-name>, <last-name> o <nickname>)
  const autores: string[] = [];
  for (const a of buscarElementosXml(tiXml, "author")) {
    const partes = [
      buscarElementosXml(a.interior, "first-name")[0]?.texto,
      buscarElementosXml(a.interior, "middle-name")[0]?.texto,
      buscarElementosXml(a.interior, "last-name")[0]?.texto,
    ].filter(Boolean);
    if (partes.length > 0) {
      autores.push(partes.join(" "));
    } else {
      const nick = buscarElementosXml(a.interior, "nickname")[0]?.texto;
      if (nick) autores.push(nick);
    }
  }
  const autor = autores.length > 0 ? [...new Set(autores)].join(", ").slice(0, 200) : null;

  // Sinopsis (<annotation>)
  const annotNode = buscarElementosXml(tiXml, "annotation")[0];
  const sinopsis = annotNode ? htmlATextoPlano(annotNode.interior)?.slice(0, 5000) ?? null : null;

  // Portada (<coverpage><image href="#id"/></coverpage> -> <binary id="id">)
  let portada: Buffer | null = null;
  const coverpageNode = buscarElementosXml(tiXml, "coverpage")[0];
  const binaries = buscarElementosXml(xml, "binary");
  if (coverpageNode) {
    const imgNode = buscarElementosXml(coverpageNode.interior, "image")[0];
    const href = imgNode?.attrs.href ?? "";
    const imageId = href.startsWith("#") ? href.slice(1) : href;
    if (imageId) {
      const bin = binaries.find((b) => b.attrs.id === imageId);
      if (bin?.texto) {
        const b = Buffer.from(bin.texto.replace(/\s+/g, ""), "base64");
        if (esImagenBuffer(b)) portada = b;
      }
    }
  }
  if (!portada && binaries.length > 0) {
    for (const bin of binaries) {
      if (!bin.texto) continue;
      const b = Buffer.from(bin.texto.replace(/\s+/g, ""), "base64");
      if (esImagenBuffer(b)) {
        portada = b;
        break;
      }
    }
  }

  return { titulo, autor, sinopsis, portada };
}

// ── 4. Extractor CBZ / CBR (portado de BookOrbit cbz-metadata.ts + cover-cbz/cbr.ts) ──

function esRutaOcultaArchivo(ruta: string): boolean {
  return ruta.replace(/\\/g, "/").split("/").some((p) => p.startsWith(".") || p === "__MACOSX");
}

function esArchivoImagenNombre(nombre: string): boolean {
  const dot = nombre.lastIndexOf(".");
  return dot !== -1 && EXTENSIONES_IMAGEN.has(nombre.slice(dot).toLowerCase());
}

function indiceExtension(ruta: string): number {
  const sep = Math.max(ruta.lastIndexOf("/"), ruta.lastIndexOf("\\"));
  const dot = ruta.lastIndexOf(".");
  return dot > sep + 1 ? dot : ruta.length;
}

export function compararRutasArchivo(a: string, b: string): number {
  const extA = indiceExtension(a);
  const extB = indiceExtension(b);
  return (
    COLLATOR_ARCHIVO.compare(a.slice(0, extA), b.slice(0, extB)) ||
    COLLATOR_ARCHIVO.compare(a.slice(extA), b.slice(extB))
  );
}

function parsearComicInfoXml(xmlBuf: Buffer): Omit<MetadatosLibro, "portada"> | null {
  const xml = xmlBuf.toString("utf8");
  const ciNode = buscarElementosXml(xml, "ComicInfo")[0];
  if (!ciNode) return null;
  const ci = ciNode.interior;

  const campo = (tag: string): string | null => buscarElementosXml(ci, tag)[0]?.texto || null;
  const rawTitle = campo("Title");
  const series = campo("Series");
  const number = campo("Number");
  const titulo = limpiarTituloExtraido(rawTitle ?? (series ? (number ? `${series} #${number}` : series) : null));

  const escritores = [campo("Writer"), campo("Penciller")]
    .filter((x): x is string => Boolean(x))
    .flatMap((v) => v.split(/[,;]/).map((s) => s.trim()).filter(Boolean));
  const autor = escritores.length > 0 ? [...new Set(escritores)].join(", ").slice(0, 200) : null;

  const resumen = campo("Summary") ?? campo("Description");
  const sinopsis = resumen ? htmlATextoPlano(resumen)?.slice(0, 5000) ?? null : null;

  return { titulo, autor, sinopsis };
}

function parsearComicBookInfoJson(comentario: string): Omit<MetadatosLibro, "portada"> | null {
  try {
    const data = JSON.parse(comentario) as Record<string, unknown>;
    const cbi = data["ComicBookInfo/1.0"] as Record<string, unknown> | undefined;
    if (!cbi || typeof cbi !== "object") return null;

    const rawTitle = typeof cbi.title === "string" ? cbi.title : null;
    const series = typeof cbi.series === "string" ? cbi.series : null;
    const issue = cbi.issue != null ? String(cbi.issue) : null;
    const titulo = limpiarTituloExtraido(rawTitle ?? (series ? (issue ? `${series} #${issue}` : series) : null));

    const credits = Array.isArray(cbi.credits) ? (cbi.credits as { person?: unknown; role?: unknown }[]) : [];
    const writers = credits
      .filter((c) => typeof c?.person === "string" && (!c.role || String(c.role).toLowerCase() === "writer"))
      .map((c) => String(c.person).trim())
      .filter(Boolean);
    const autor = writers.length > 0 ? [...new Set(writers)].join(", ").slice(0, 200) : null;

    const comments = typeof cbi.comments === "string" ? cbi.comments.trim() : null;
    const sinopsis = comments ? comments.slice(0, 5000) : null;

    return { titulo, autor, sinopsis };
  } catch {
    return null;
  }
}

function extraerCbzBuffer(buf: Buffer): MetadatosLibro | null {
  const indice = leerIndiceZip(buf);
  if (!indice) return null;

  let meta: Omit<MetadatosLibro, "portada"> | null = null;
  const comicInfoEntry = indice.entradas.find(
    (e) => e.nombre.replace(/\\/g, "/").split("/").pop()?.toLowerCase() === "comicinfo.xml",
  );
  if (comicInfoEntry) {
    const xmlBuf = extraerEntradaZip(buf, comicInfoEntry);
    if (xmlBuf) meta = parsearComicInfoXml(xmlBuf);
  }
  if (!meta && indice.comentario) {
    meta = parsearComicBookInfoJson(indice.comentario);
  }

  const imagenes = indice.entradas.filter(
    (e) => !e.nombre.endsWith("/") && !esRutaOcultaArchivo(e.nombre) && esArchivoImagenNombre(e.nombre),
  );
  imagenes.sort((a, b) => compararRutasArchivo(a.nombre, b.nombre));

  let portada: Buffer | null = null;
  for (const img of imagenes) {
    const extraida = extraerEntradaZip(buf, img);
    if (esImagenBuffer(extraida)) {
      portada = extraida;
      break;
    }
  }

  return {
    titulo: meta?.titulo ?? null,
    autor: meta?.autor ?? null,
    sinopsis: meta?.sinopsis ?? null,
    portada,
  };
}

/** Lee un entero vint (LEB128) de RAR 5.0; devuelve { valor, bytesLeidos }. */
function leerVintRar5(buf: Buffer, offset: number): { valor: number; bytes: number } | null {
  let valor = 0;
  let shift = 0;
  for (let i = 0; i < 10; i++) {
    if (offset + i >= buf.length) return null;
    const b = buf[offset + i];
    valor += (b & 0x7f) * 2 ** shift;
    if ((b & 0x80) === 0) return { valor, bytes: i + 1 };
    shift += 7;
  }
  return null;
}

type EntradaRar = { nombre: string; datos: Buffer };

function listarEntradasRar4(buf: Buffer): EntradaRar[] {
  const entradas: EntradaRar[] = [];
  let pos = 7; // después de Rar!\x1a\x07\x00
  while (pos + 7 <= buf.length) {
    const headType = buf[pos + 2];
    const headFlags = buf.readUInt16LE(pos + 3);
    const headSize = buf.readUInt16LE(pos + 5);
    if (headSize < 7 || pos + headSize > buf.length) break;

    let addSize = 0;
    if ((headFlags & 0x8000) !== 0 || headType === 0x74) {
      if (pos + 11 > buf.length) break;
      addSize = buf.readUInt32LE(pos + 7);
    }

    if (headType === 0x74 && pos + 32 <= buf.length) {
      let highPack = 0;
      let nameOffset = pos + 32;
      if ((headFlags & 0x0100) !== 0) {
        if (pos + 40 > buf.length) break;
        highPack = buf.readUInt32LE(pos + 32);
        nameOffset = pos + 40;
      }
      const packSize = highPack * 0x100000000 + addSize;
      const method = buf[pos + 25];
      const nameSize = buf.readUInt16LE(pos + 26);
      const isDir = (headFlags & 0x00e0) === 0x00e0;

      if (!isDir && nameOffset + nameSize <= pos + headSize) {
        const rawName = buf.subarray(nameOffset, nameOffset + nameSize);
        const zeroIdx = rawName.indexOf(0);
        const nombre = (zeroIdx >= 0 ? rawName.subarray(0, zeroIdx) : rawName).toString("utf8");
        const dataStart = pos + headSize;
        const dataEnd = dataStart + packSize;
        // method 0x30 = Store (sin compresión, estándar en CBR para imágenes JPEG/PNG)
        if (method === 0x30 && dataEnd <= buf.length) {
          entradas.push({ nombre, datos: Buffer.from(buf.subarray(dataStart, dataEnd)) });
        }
      }
      pos = pos + headSize + packSize;
    } else {
      if (headType === 0x7b) break; // fin de archivo RAR4
      pos = pos + headSize + addSize;
    }
  }
  return entradas;
}

function listarEntradasRar5(buf: Buffer): EntradaRar[] {
  const entradas: EntradaRar[] = [];
  let pos = 8; // después de Rar!\x1a\x07\x01\x00
  while (pos + 7 <= buf.length) {
    const hdrSizeV = leerVintRar5(buf, pos + 4);
    if (!hdrSizeV) break;
    const hdrStart = pos + 4 + hdrSizeV.bytes;
    const hdrEnd = hdrStart + hdrSizeV.valor;
    if (hdrEnd > buf.length) break;

    let cursor = hdrStart;
    const typeV = leerVintRar5(buf, cursor);
    if (!typeV) break;
    cursor += typeV.bytes;
    const flagsV = leerVintRar5(buf, cursor);
    if (!flagsV) break;
    cursor += flagsV.bytes;

    let extraAreaSize = 0;
    if ((flagsV.valor & 0x0001) !== 0) {
      const v = leerVintRar5(buf, cursor);
      if (!v) break;
      extraAreaSize = v.valor;
      cursor += v.bytes;
    }
    let dataSize = 0;
    if ((flagsV.valor & 0x0002) !== 0) {
      const v = leerVintRar5(buf, cursor);
      if (!v) break;
      dataSize = v.valor;
      cursor += v.bytes;
    }

    if (typeV.valor === 2) {
      // File header en RAR5
      const fileFlagsV = leerVintRar5(buf, cursor);
      if (!fileFlagsV) break;
      cursor += fileFlagsV.bytes;
      const unpSizeV = leerVintRar5(buf, cursor);
      if (!unpSizeV) break;
      cursor += unpSizeV.bytes;
      const attrV = leerVintRar5(buf, cursor);
      if (!attrV) break;
      cursor += attrV.bytes;
      if ((fileFlagsV.valor & 0x0002) !== 0) cursor += 4; // mtime
      if ((fileFlagsV.valor & 0x0004) !== 0) cursor += 4; // crc32
      const compInfoV = leerVintRar5(buf, cursor);
      if (!compInfoV) break;
      cursor += compInfoV.bytes;
      const hostOsV = leerVintRar5(buf, cursor);
      if (!hostOsV) break;
      cursor += hostOsV.bytes;
      const nameLenV = leerVintRar5(buf, cursor);
      if (!nameLenV) break;
      cursor += nameLenV.bytes;

      const isDir = (fileFlagsV.valor & 0x0001) !== 0;
      const method = (compInfoV.valor >> 7) & 0x07;
      if (!isDir && cursor + nameLenV.valor <= hdrEnd - extraAreaSize && method === 0 && hdrEnd + dataSize <= buf.length) {
        const nombre = buf.subarray(cursor, cursor + nameLenV.valor).toString("utf8");
        entradas.push({ nombre, datos: Buffer.from(buf.subarray(hdrEnd, hdrEnd + dataSize)) });
      }
    } else if (typeV.valor === 5) {
      break; // End of archive header
    }

    pos = hdrEnd + dataSize;
  }
  return entradas;
}

function buscarImagenEmbebidaEnBuffer(buf: Buffer, desdeOffset = 0): Buffer | null {
  // Busca el primer stream JPEG (FF D8 FF ... FF D9) o PNG (89 50 4E 47 ... IEND) embebido
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const iendSig = Buffer.from([0x49, 0x45, 0x4e, 0x44]);

  const jpegIdx = buf.indexOf(Buffer.from([0xff, 0xd8, 0xff]), desdeOffset);
  const pngIdx = buf.indexOf(pngSig, desdeOffset);

  const candidatos: { idx: number; tipo: "jpeg" | "png" }[] = [];
  if (jpegIdx >= 0) candidatos.push({ idx: jpegIdx, tipo: "jpeg" });
  if (pngIdx >= 0) candidatos.push({ idx: pngIdx, tipo: "png" });
  candidatos.sort((a, b) => a.idx - b.idx);

  for (const c of candidatos) {
    if (c.tipo === "png") {
      const iend = buf.indexOf(iendSig, c.idx + 8);
      if (iend > c.idx && iend + 8 <= buf.length) {
        return Buffer.from(buf.subarray(c.idx, iend + 8));
      }
    } else {
      // Busca el marcador EOI (FF D9) del JPEG
      let scan = c.idx + 3;
      while (scan < buf.length - 1) {
        const eoi = buf.indexOf(Buffer.from([0xff, 0xd9]), scan);
        if (eoi < 0) break;
        const slice = Buffer.from(buf.subarray(c.idx, eoi + 2));
        if (slice.length >= 64) return slice;
        scan = eoi + 2;
      }
    }
  }
  return null;
}

function extraerCbrBuffer(buf: Buffer): MetadatosLibro | null {
  const esRar5 = buf.length >= 8 && buf[6] === 0x01 && buf[7] === 0x00;
  const entradas = esRar5 ? listarEntradasRar5(buf) : listarEntradasRar4(buf);

  let meta: Omit<MetadatosLibro, "portada"> | null = null;
  const comicInfo = entradas.find(
    (e) => e.nombre.replace(/\\/g, "/").split("/").pop()?.toLowerCase() === "comicinfo.xml",
  );
  if (comicInfo) {
    meta = parsearComicInfoXml(comicInfo.datos);
  }
  if (!meta) {
    // Fallback si ComicInfo.xml quedó sin comprimir dentro de un bloque
    const latin = buf.toString("utf8");
    const m = latin.match(/<ComicInfo\b[\s\S]*?<\/ComicInfo>/i);
    if (m) meta = parsearComicInfoXml(Buffer.from(m[0], "utf8"));
  }

  const imagenes = entradas.filter(
    (e) => !esRutaOcultaArchivo(e.nombre) && esArchivoImagenNombre(e.nombre) && esImagenBuffer(e.datos),
  );
  imagenes.sort((a, b) => compararRutasArchivo(a.nombre, b.nombre));

  const portada = imagenes[0]?.datos ?? buscarImagenEmbebidaEnBuffer(buf, esRar5 ? 8 : 7);

  return {
    titulo: meta?.titulo ?? null,
    autor: meta?.autor ?? null,
    sinopsis: meta?.sinopsis ?? null,
    portada,
  };
}

function extraerComic(buf: Buffer): MetadatosLibro | null {
  // Detección real de contenedor por magic bytes (BookOrbit detectComicContainerFormat)
  if (esZipBuffer(buf)) return extraerCbzBuffer(buf);
  if (esRarBuffer(buf)) return extraerCbrBuffer(buf);
  return null;
}

// ── 5. Extractor PDF (portado de BookOrbit pdf-xmp-reader.ts + Homebranch pdf-parser.service.ts) ──

function decodificarLiteralPdf(raw: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch !== "\\") {
      bytes.push(raw.charCodeAt(i) & 0xff);
      continue;
    }
    i++;
    if (i >= raw.length) break;
    const next = raw[i];
    if (next === "n") bytes.push(10);
    else if (next === "r") bytes.push(13);
    else if (next === "t") bytes.push(9);
    else if (next === "b") bytes.push(8);
    else if (next === "f") bytes.push(12);
    else if (next === "(" || next === ")" || next === "\\") bytes.push(next.charCodeAt(0));
    else if (next === "\r" || next === "\n") {
      if (next === "\r" && raw[i + 1] === "\n") i++;
    } else if (next >= "0" && next <= "7") {
      let oct = next;
      if (raw[i + 1] >= "0" && raw[i + 1] <= "7") oct += raw[++i];
      if (raw[i + 1] >= "0" && raw[i + 1] <= "7") oct += raw[++i];
      bytes.push(Number.parseInt(oct, 8) & 0xff);
    } else {
      bytes.push(next.charCodeAt(0) & 0xff);
    }
  }
  return decodificarBytesTextoPdf(Buffer.from(bytes));
}

function decodificarHexPdf(hexRaw: string): string {
  let limpio = hexRaw.replace(/\s+/g, "");
  if (limpio.length % 2 === 1) limpio += "0";
  const buf = Buffer.from(limpio, "hex");
  return decodificarBytesTextoPdf(buf);
}

function decodificarBytesTextoPdf(buf: Buffer): string {
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buf.subarray(2)).replace(/\0+$/, "").trim();
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buf.subarray(2)).replace(/\0+$/, "").trim();
  }
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.subarray(3).toString("utf8").replace(/\0+$/, "").trim();
  }
  return buf.toString("latin1").replace(/\0+$/, "").trim();
}

/** Extrae el valor de `/Clave (literal)` o `/Clave <hex>` en un diccionario PDF, respetando paréntesis anidados. */
function leerCampoDiccionarioPdf(textoPdf: string, clave: string): string | null {
  const re = new RegExp(`\\/${clave}\\s*([(<])`, "g");
  for (const m of textoPdf.matchAll(re)) {
    const tipo = m[1];
    const start = (m.index ?? 0) + m[0].length;
    if (tipo === "<") {
      const end = textoPdf.indexOf(">", start);
      if (end > start) {
        const val = decodificarHexPdf(textoPdf.slice(start, end));
        if (val) return val;
      }
    } else {
      let depth = 1;
      let i = start;
      while (i < textoPdf.length && depth > 0) {
        const c = textoPdf[i];
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === "(") depth++;
        else if (c === ")") depth--;
        i++;
      }
      if (depth === 0) {
        const val = decodificarLiteralPdf(textoPdf.slice(start, i - 1));
        if (val) return val;
      }
    }
  }
  return null;
}

function parsearXmpPdf(xmpXml: string): { titulo: string | null; autor: string | null; sinopsis: string | null } {
  const textoDeNodoDc = (nombreLocal: string): string[] => {
    const nodos = buscarElementosXml(xmpXml, nombreLocal);
    const valores: string[] = [];
    for (const n of nodos) {
      const lis = buscarElementosXml(n.interior, "li");
      if (lis.length > 0) {
        for (const li of lis) if (li.texto) valores.push(li.texto);
      } else if (n.texto) {
        valores.push(n.texto);
      }
    }
    return valores;
  };

  const titulos = textoDeNodoDc("title");
  const creadores = textoDeNodoDc("creator");
  const descripciones = textoDeNodoDc("description");

  return {
    titulo: limpiarTituloExtraido(titulos[0]),
    autor: creadores.length > 0 ? [...new Set(creadores)].join(", ").slice(0, 200) : null,
    sinopsis: descripciones[0] ? htmlATextoPlano(descripciones[0])?.slice(0, 5000) ?? null : null,
  };
}

function deshacerPredictorPng(datos: Buffer, ancho: number, alto: number, bytesPorPixel: number): Buffer | null {
  const rowBytes = ancho * bytesPorPixel;
  const stride = rowBytes + 1;
  if (datos.length < stride * alto) return null;
  const out = Buffer.allocUnsafe(rowBytes * alto);

  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    return pb <= pc ? b : c;
  };

  for (let y = 0; y < alto; y++) {
    const filter = datos[y * stride];
    const srcStart = y * stride + 1;
    const dstStart = y * rowBytes;
    const prevStart = (y - 1) * rowBytes;

    for (let x = 0; x < rowBytes; x++) {
      const raw = datos[srcStart + x];
      const left = x >= bytesPorPixel ? out[dstStart + x - bytesPorPixel] : 0;
      const up = y > 0 ? out[prevStart + x] : 0;
      const upLeft = y > 0 && x >= bytesPorPixel ? out[prevStart + x - bytesPorPixel] : 0;
      let val = raw;
      if (filter === 1) val = (raw + left) & 0xff;
      else if (filter === 2) val = (raw + up) & 0xff;
      else if (filter === 3) val = (raw + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) val = (raw + paeth(left, up, upLeft)) & 0xff;
      out[dstStart + x] = val;
    }
  }
  return out;
}

async function extraerPortadaPdfBuffer(buf: Buffer, latin: string): Promise<Buffer | null> {
  // 1. Streams de imagen con /Subtype /Image
  const streamRe = /<<([\s\S]{1,1200}?)>>\s*stream(?:\r\n|\n|\r)/g;
  for (const m of latin.matchAll(streamRe)) {
    const dict = m[1];
    if (!/\/Subtype\s*\/Image\b/.test(dict)) continue;

    const streamStart = (m.index ?? 0) + m[0].length;
    const endIdx = latin.indexOf("endstream", streamStart);
    if (endIdx <= streamStart) continue;
    let rawEnd = endIdx;
    if (latin[rawEnd - 1] === "\n") rawEnd--;
    if (latin[rawEnd - 1] === "\r") rawEnd--;
    const rawStream = buf.subarray(streamStart, rawEnd);

    // 1a. JPEG directo (/DCTDecode)
    if (/\/DCTDecode\b|\/DCT\b/.test(dict)) {
      const slice = Buffer.from(rawStream);
      if (esImagenBuffer(slice)) return slice;
    }

    // 1b. /FlateDecode sobre imagen raster (/Width, /Height, /ColorSpace)
    if (/\/FlateDecode\b|\/Fl\b/.test(dict) && !/\/SMaskInData\b/.test(dict)) {
      const w = Number(dict.match(/\/Width\s+(\d+)/)?.[1] ?? 0);
      const h = Number(dict.match(/\/Height\s+(\d+)/)?.[1] ?? 0);
      const bpc = Number(dict.match(/\/BitsPerComponent\s+(\d+)/)?.[1] ?? 8);
      const predictor = Number(dict.match(/\/Predictor\s+(\d+)/)?.[1] ?? 1);
      const channels: 1 | 3 | null = /\/DeviceRGB\b/.test(dict) ? 3 : /\/DeviceGray\b/.test(dict) ? 1 : null;
      if (w >= 40 && h >= 40 && w <= 4000 && h <= 4000 && bpc === 8 && channels) {
        try {
          const inflado = inflateSync(rawStream);
          if (esImagenBuffer(inflado)) return Buffer.from(inflado);
          const pixels = predictor >= 10 ? deshacerPredictorPng(inflado, w, h, channels) : inflado;
          if (pixels && pixels.length === w * h * channels) {
            return await sharp(pixels, { raw: { width: w, height: h, channels } }).png().toBuffer();
          }
        } catch {
          // continúa buscando el siguiente objeto de imagen
        }
      }
    }
  }

  // 2. Fallback: busca un JPEG o PNG embebido directamente en el PDF
  return buscarImagenEmbebidaEnBuffer(buf, 0);
}

async function extraerPdf(buf: Buffer): Promise<MetadatosLibro | null> {
  if (buf.length < 8 || buf.subarray(0, 5).toString("ascii") !== "%PDF-") return null;
  const latin = buf.toString("latin1");

  let xmpMeta: { titulo: string | null; autor: string | null; sinopsis: string | null } = {
    titulo: null,
    autor: null,
    sinopsis: null,
  };

  // 1. XMP sin comprimir en el archivo
  const utf8 = buf.toString("utf8");
  const xmpMatch = utf8.match(/<x:xmpmeta\b[\s\S]*?<\/x:xmpmeta>/i) ?? utf8.match(/<rdf:RDF\b[\s\S]*?<\/rdf:RDF>/i);
  if (xmpMatch) {
    xmpMeta = parsearXmpPdf(xmpMatch[0]);
  } else {
    // 2. XMP dentro de un stream /Type /Metadata comprimido con /FlateDecode
    const metaStreamRe = /<<([\s\S]{1,600}?\/Subtype\s*\/XML[\s\S]{0,600}?)>>\s*stream(?:\r\n|\n|\r)/g;
    for (const m of latin.matchAll(metaStreamRe)) {
      const start = (m.index ?? 0) + m[0].length;
      const end = latin.indexOf("endstream", start);
      if (end <= start) continue;
      let rawEnd = end;
      if (latin[rawEnd - 1] === "\n") rawEnd--;
      if (latin[rawEnd - 1] === "\r") rawEnd--;
      try {
        const inflado = inflateSync(buf.subarray(start, rawEnd)).toString("utf8");
        xmpMeta = parsearXmpPdf(inflado);
        if (xmpMeta.titulo || xmpMeta.autor || xmpMeta.sinopsis) break;
      } catch {
        // continúa
      }
    }
  }

  // 3. Diccionario /Info del PDF
  const infoTitle = limpiarTituloExtraido(leerCampoDiccionarioPdf(latin, "Title"));
  const rawInfoAuthor = leerCampoDiccionarioPdf(latin, "Author")?.trim() ?? null;
  // Descarta autores comodín de 1 carácter como `/Author(x)` de impresoras virtuales Ghostscript
  const infoAuthor = rawInfoAuthor && rawInfoAuthor.length > 1 ? rawInfoAuthor.slice(0, 200) : null;
  const infoSubject = leerCampoDiccionarioPdf(latin, "Subject")?.trim() || null;

  const titulo = xmpMeta.titulo ?? infoTitle;
  const autor = xmpMeta.autor ?? infoAuthor;
  const sinopsis = xmpMeta.sinopsis ?? (infoSubject ? infoSubject.slice(0, 5000) : null);
  const portada = await extraerPortadaPdfBuffer(buf, latin);

  return { titulo, autor, sinopsis, portada };
}

// ── 6. Extractor Audio (ID3v2 para MP3, átomos ilst para M4B/M4A, Vorbis para OGG) ──

function decodificarTextoId3(payload: Buffer): string | null {
  if (payload.length <= 1) return null;
  const enc = payload[0];
  const body = payload.subarray(1);
  let txt = "";
  if (enc === 0) txt = body.toString("latin1");
  else if (enc === 1) {
    if (body.length >= 2 && body[0] === 0xfe && body[1] === 0xff) txt = new TextDecoder("utf-16be").decode(body.subarray(2));
    else if (body.length >= 2 && body[0] === 0xff && body[1] === 0xfe) txt = new TextDecoder("utf-16le").decode(body.subarray(2));
    else txt = new TextDecoder("utf-16le").decode(body);
  } else if (enc === 2) txt = new TextDecoder("utf-16be").decode(body);
  else txt = body.toString("utf8");
  return txt.replace(/\0+$/, "").trim() || null;
}

function extraerMp3Id3(buf: Buffer): MetadatosLibro | null {
  if (buf.length < 10 || buf.subarray(0, 3).toString("ascii") !== "ID3") return null;
  const version = buf[3];
  const tagSize = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
  const end = Math.min(buf.length, 10 + tagSize);

  let pos = 10;
  let tit2: string | null = null;
  let talb: string | null = null;
  let tpe1: string | null = null;
  let tpe2: string | null = null;
  let comm: string | null = null;
  let portada: Buffer | null = null;

  while (pos + 10 <= end) {
    const id = buf.subarray(pos, pos + 4).toString("ascii");
    if (!/^[A-Z0-9]{4}$/.test(id)) break;
    const frameSize =
      version === 4
        ? ((buf[pos + 4] & 0x7f) << 21) | ((buf[pos + 5] & 0x7f) << 14) | ((buf[pos + 6] & 0x7f) << 7) | (buf[pos + 7] & 0x7f)
        : buf.readUInt32BE(pos + 4);
    if (frameSize <= 0 || pos + 10 + frameSize > end) break;
    const data = buf.subarray(pos + 10, pos + 10 + frameSize);

    if (id === "TIT2") tit2 = decodificarTextoId3(data);
    else if (id === "TALB") talb = decodificarTextoId3(data);
    else if (id === "TPE1") tpe1 = decodificarTextoId3(data);
    else if (id === "TPE2") tpe2 = decodificarTextoId3(data);
    else if (id === "COMM" && data.length > 4) {
      // [encoding(1)][lang(3)][short_desc\0][comment]
      const rest = data.subarray(4);
      const zeroIdx = rest.lastIndexOf(0);
      const textoBuf = Buffer.concat([Buffer.from([data[0]]), zeroIdx >= 0 ? rest.subarray(zeroIdx + 1) : rest]);
      comm = decodificarTextoId3(textoBuf);
    } else if (id === "APIC" && !portada && data.length > 4) {
      const img = buscarImagenEmbebidaEnBuffer(data, 1);
      if (esImagenBuffer(img)) portada = img;
    }

    pos += 10 + frameSize;
  }

  return {
    titulo: limpiarTituloExtraido(talb ?? tit2),
    autor: (tpe2 ?? tpe1)?.slice(0, 200) ?? null,
    sinopsis: comm?.slice(0, 5000) ?? null,
    portada,
  };
}

// ── Punto de entrada unificado ────────────────────────────────────────────────

/**
 * Extrae metadatos (`titulo`, `autor`, `sinopsis`) y los bytes de la `portada` para cualquier formato
 * admitido (`epub`, `pdf`, `mobi`, `azw`, `azw3`, `cbz`, `cbr`, `fb2` y audio), completando con el
 * parser de nombre de archivo de BookOrbit cuando algún campo no viene embebido en el archivo.
 */
export async function extraerMetadatosLibro(
  datos: Buffer,
  formato: Formato,
  nombreArchivo?: string | null,
): Promise<MetadatosLibro> {
  let extraido: MetadatosLibro | null = null;
  try {
    switch (formato) {
      case "epub":
        extraido = extraerEpub(datos);
        break;
      case "mobi":
      case "azw":
      case "azw3":
        extraido = extraerMobi(datos);
        break;
      case "fb2":
        extraido = extraerFb2(datos);
        break;
      case "cbz":
      case "cbr":
        extraido = extraerComic(datos);
        break;
      case "pdf":
        extraido = await extraerPdf(datos);
        break;
      case "mp3":
      case "m4b":
      case "m4a":
      case "ogg":
        extraido = extraerMp3Id3(datos);
        break;
    }
  } catch {
    extraido = null;
  }

  const desdeNombre = nombreArchivo ? parsearNombreArchivo(nombreArchivo) : null;
  let portada = extraido?.portada ?? null;
  if (portada) {
    try {
      await sharp(portada).metadata();
    } catch {
      portada = null;
    }
  }

  return {
    titulo: limpiarTituloExtraido(extraido?.titulo) ?? desdeNombre?.titulo ?? null,
    autor: limpiarAutorExtraido(extraido?.autor) ?? limpiarAutorExtraido(desdeNombre?.autor) ?? null,
    sinopsis: extraido?.sinopsis ?? null,
    portada,
  };
}
