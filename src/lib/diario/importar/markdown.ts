// Diario (lane 292): importar notas en Markdown con front matter. Portado de
// vendor/moodiary/packages/feature/moodiary_export/lib/src/data/import/{markdown_front_matter,markdown_importer,import_media_stage,import_source}.dart (ZhuJHua/moodiary@2c552dd).
// También lee las notas que exporta la lane 291 (`date`, `title`, `mood`, `category`, `tags`, `trackers`, `favorite`, `pinned`).
import { clasificarAdjunto } from "../adjuntos.ts";
import { limpiarNombre, MAX_NOMBRE } from "../etiquetas.ts";
import { animoValido, aTexto, carpetaDe, esImagen, fechaValida, limpiarCuerpo, momentoDeIso, nombreDe, resolverArchivo, titulo } from "./comun.ts";
import { entradaBase, ImportacionError, MARCADOR_ARCHIVO, MARCADOR_IMAGEN, paqueteVacio, type Archivos, type EtiquetaPuestaImport, type MomentoImport, type PaqueteImport } from "./tipos.ts";

// ── YAML mínimo ──────────────────────────────────────────────────────────────

const sinComentario = (s: string): string => {
  let comilla: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (comilla) {
      if (c === "\\" && comilla === '"') i++;
      else if (c === comilla) comilla = null;
    } else if (c === '"' || c === "'") comilla = c;
    else if (c === "#" && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i).trimEnd();
  }
  return s;
};

function partirLista(s: string): string[] {
  const partes: string[] = [];
  let actual = "";
  let comilla: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (comilla) {
      actual += c;
      if (c === "\\" && comilla === '"') actual += s[++i] ?? "";
      else if (c === comilla) comilla = null;
    } else if (c === '"' || c === "'") {
      comilla = c;
      actual += c;
    } else if (c === ",") {
      partes.push(actual);
      actual = "";
    } else actual += c;
  }
  if (actual.trim() || partes.length) partes.push(actual);
  return partes.map((p) => p.trim()).filter((p) => p !== "");
}

/** Un valor escalar o en línea (`"texto"`, `'texto'`, número, booleano, `[a, b]`, `{"a": 1}`). */
export function valorYaml(crudo: string): unknown {
  const s = sinComentario(crudo.trim()).trim();
  if (s === "" || s === "~" || s === "null") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (s.startsWith('"')) {
    try {
      const v = JSON.parse(s);
      if (typeof v === "string") return v;
    } catch {
      // comillas mal cerradas: se toma tal cual abajo
    }
    return s.replace(/^"|"$/g, "");
  }
  if (s.startsWith("'")) return s.replace(/^'|'$/g, "").replace(/''/g, "'");
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const v = JSON.parse(s);
      if (Array.isArray(v)) return v;
    } catch {
      // lista sin comillas JSON
    }
    return partirLista(s.slice(1, -1)).map(valorYaml);
  }
  if (s.startsWith("{") && s.endsWith("}")) {
    try {
      const v = JSON.parse(s);
      if (v && typeof v === "object" && !Array.isArray(v)) return v;
    } catch {
      // mapa sin comillas JSON
    }
    const mapa: Record<string, unknown> = {};
    for (const par of partirLista(s.slice(1, -1))) {
      const i = par.indexOf(":");
      if (i > 0) mapa[String(valorYaml(par.slice(0, i)))] = valorYaml(par.slice(i + 1));
    }
    return mapa;
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

/** Las claves del nivel superior; una lista con guiones o un mapa de un nivel debajo de una clave también se leen. */
export function leerYaml(bloque: string): Record<string, unknown> {
  const lineas = bloque.split("\n");
  const salida: Record<string, unknown> = {};
  for (let i = 0; i < lineas.length; i++) {
    const m = /^([^\s#:][^:]*?)\s*:(?:\s+(.*))?$/.exec(lineas[i]);
    if (!m) continue;
    const clave = m[1].replace(/^["']|["']$/g, "");
    if (m[2] !== undefined && m[2].trim() !== "") {
      salida[clave] = valorYaml(m[2]);
      continue;
    }
    const hijos: string[] = [];
    while (i + 1 < lineas.length && (/^\s+\S/.test(lineas[i + 1]) || /^-\s/.test(lineas[i + 1]))) hijos.push(lineas[++i]);
    if (!hijos.length) salida[clave] = null;
    else if (hijos.every((h) => /^\s*-\s/.test(h))) salida[clave] = hijos.map((h) => valorYaml(h.replace(/^\s*-\s+/, "")));
    else {
      const mapa: Record<string, unknown> = {};
      for (const h of hijos) {
        const kv = /^\s+([^\s:][^:]*?)\s*:\s*(.*)$/.exec(h);
        if (kv) mapa[kv[1].replace(/^["']|["']$/g, "")] = valorYaml(kv[2]);
      }
      salida[clave] = mapa;
    }
  }
  return salida;
}

// ── Front matter (moodiary `MarkdownFrontMatter`) ────────────────────────────

export interface MarkdownLeido {
  meta: Record<string, unknown>;
  cuerpo: string;
}

export function leerFrontMatter(fuente: string): MarkdownLeido {
  const texto = fuente.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lineas = texto.split("\n");
  if (lineas[0]?.trimEnd() !== "---") return { meta: {}, cuerpo: texto };
  const cierre = lineas.findIndex((l, i) => i > 0 && /^(---|\.\.\.)[ \t]*$/.test(l));
  if (cierre < 0) return { meta: {}, cuerpo: texto };
  return { meta: leerYaml(lineas.slice(1, cierre).join("\n")), cuerpo: lineas.slice(cierre + 1).join("\n") };
}

const RE_TITULO = /^#[ \t]+(.+?)[ \t]*#*[ \t]*$/;

/** moodiary `splitLeadingTitle`: un `# Título` al principio sale del cuerpo. */
export function separarTitulo(cuerpo: string): { titulo: string | null; cuerpo: string } {
  const lineas = cuerpo.split("\n");
  let i = 0;
  while (i < lineas.length && !lineas[i].trim()) i++;
  const m = i < lineas.length ? RE_TITULO.exec(lineas[i]) : null;
  const t = m ? m[1].replace(/\\(.)/g, "$1").trim() : "";
  if (!t) return { titulo: null, cuerpo };
  let resto = lineas.slice(i + 1);
  while (resto.length && !resto[0].trim()) resto = resto.slice(1);
  return { titulo: t, cuerpo: resto.join("\n") };
}

const RE_FECHA_NOMBRE = /^(\d{4})-(\d{2})-(\d{2})/;

export function fechaDeNombre(nombre: string): string | null {
  const m = RE_FECHA_NOMBRE.exec(nombreDe(nombre));
  if (!m || !fechaValida(Number(m[1]), Number(m[2]), Number(m[3]))) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** moodiary `titleFromFileName`: el nombre sin la fecha del principio ni separadores; «2» (el `_2` de un segundo día) no es un título. */
export function tituloDeNombre(nombre: string): string | null {
  const n = nombreDe(nombre).replace(/\.(md|markdown)$/i, "").replace(RE_FECHA_NOMBRE, "").replace(/^[\s_\-–—]+/, "").trim();
  return !n || /^\d+$/.test(n) ? null : n;
}

// ── Ánimo y etiquetas del front matter ───────────────────────────────────────

const ANIMO_POR_NOMBRE: Record<string, number> = {
  "muy mal": 1,
  terrible: 1,
  "very bad": 1,
  "very unpleasant": 1,
  mal: 2,
  bad: 2,
  unpleasant: 2,
  normal: 3,
  neutral: 3,
  okay: 3,
  regular: 3,
  bien: 4,
  good: 4,
  pleasant: 4,
  "muy bien": 5,
  excelente: 5,
  awesome: 5,
  great: 5,
  "very good": 5,
  "very pleasant": 5,
};

export function animoDeMeta(v: unknown): number | null {
  if (typeof v === "number") return animoValido(v);
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (/^[1-5]$/.test(s)) return Number(s);
  return ANIMO_POR_NOMBRE[s] ?? null;
}

function etiquetasDeMeta(meta: Record<string, unknown>): EtiquetaPuestaImport[] {
  const salida: EtiquetaPuestaImport[] = [];
  const crudas = Array.isArray(meta.tags) ? meta.tags : typeof meta.tags === "string" ? [meta.tags] : [];
  for (const t of crudas) {
    const nombre = limpiarNombre(String(t ?? "")).slice(0, MAX_NOMBRE).trim();
    if (nombre && !salida.some((e) => e.nombre.toLowerCase() === nombre.toLowerCase())) salida.push({ nombre, tipo: "etiqueta", valor: null });
  }
  const contadores = meta.trackers;
  if (contadores && typeof contadores === "object" && !Array.isArray(contadores)) {
    for (const [k, v] of Object.entries(contadores)) {
      const nombre = limpiarNombre(k).slice(0, MAX_NOMBRE).trim();
      if (nombre && typeof v === "number" && Number.isFinite(v)) salida.push({ nombre, tipo: "contador", valor: String(v) });
    }
  }
  return salida;
}

// ── Imágenes y enlaces del cuerpo (moodiary `ImportMediaStage`) ──────────────

const RE_ENLACE = /(!?)\[((?:[^\]\\]|\\.)*)\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+"([^"]*)")?\s*\)/g;
const RE_ESQUEMA = /^[a-z][a-z0-9+.-]*:/i;

interface ResultadoCuerpo {
  cuerpo: string;
  imagenes: string[];
  faltantes: number;
  noImagenes: number;
}

/**
 * Cambia las imágenes del ZIP por `imagen://N`; una imagen que no está queda como su texto alternativo. Un audio, video o documento admitido (lane 294)
 * pasa a ser un enlace al marcador del archivo N; cualquier otro archivo queda como su nombre.
 */
export function reescribirCuerpo(cuerpo: string, archivos: Archivos, carpeta: string): ResultadoCuerpo {
  const imagenes: string[] = [];
  let faltantes = 0;
  let noImagenes = 0;
  const salida = cuerpo.replace(RE_ENLACE, (todo, bang: string, alt: string, destino: string) => {
    let objetivo = destino;
    if (objetivo.startsWith("<")) objetivo = objetivo.slice(1, -1);
    if (!objetivo || objetivo.startsWith("#") || RE_ESQUEMA.test(objetivo)) return todo;
    const ruta = resolverArchivo(archivos, carpeta, objetivo);
    if (!ruta) {
      if (bang) faltantes++;
      return bang ? alt : todo;
    }
    let i = imagenes.indexOf(ruta);
    if (!esImagen(ruta)) {
      // Otra nota del mismo ZIP no es un adjunto: queda como su nombre
      if (!clasificarAdjunto(nombreDe(ruta), "") || /\.(md|markdown)$/i.test(ruta)) {
        noImagenes++;
        return alt.trim() || nombreDe(ruta);
      }
      if (i < 0) i = imagenes.push(ruta) - 1;
      return `[${alt.trim() || nombreDe(ruta)}](${MARCADOR_ARCHIVO}${i})`;
    }
    if (i < 0) i = imagenes.push(ruta) - 1;
    return `![${alt}](${MARCADOR_IMAGEN}${i})`;
  });
  return { cuerpo: salida, imagenes, faltantes, noImagenes };
}

// ── Lector ───────────────────────────────────────────────────────────────────

const esMarkdown = (ruta: string) => /\.(md|markdown)$/i.test(ruta);

export const hayMarkdown = (archivos: Archivos): boolean => [...archivos.keys()].some(esMarkdown);

export function leerMarkdown(archivos: Archivos): PaqueteImport {
  const p = paqueteVacio("markdown");
  const rutas = [...archivos.keys()].filter(esMarkdown).sort((a, b) => a.localeCompare(b));
  if (!rutas.length) throw new ImportacionError("No hay notas en Markdown");
  let noImagenes = 0;
  const categorias = new Map<string, null>();
  for (const ruta of rutas) {
    const { meta, cuerpo: crudo } = leerFrontMatter(aTexto(archivos.get(ruta)!));
    let tit = titulo(meta.title);
    const sep = separarTitulo(crudo);
    let cuerpo = crudo;
    if (sep.titulo !== null && (tit === null || sep.titulo === tit)) {
      tit ??= sep.titulo;
      cuerpo = sep.cuerpo;
    }
    tit ??= tituloDeNombre(ruta);
    const r = reescribirCuerpo(cuerpo, archivos, carpetaDe(ruta));
    p.fotosFaltantes += r.faltantes;
    noImagenes += r.noImagenes;

    let momento: MomentoImport | null = null;
    for (const k of ["date", "time", "datetime", "created"]) {
      momento = momentoDeIso(meta[k]);
      if (momento) break;
    }
    if (!momento) {
      const f = fechaDeNombre(ruta);
      momento = f ? { fecha: f, hora: null, instante: null } : { fecha: null, hora: null, instante: null };
    }
    const categoria = titulo(meta.category);
    if (categoria) categorias.set(categoria, null);
    p.entradas.push(
      entradaBase({
        ...momento,
        titulo: tit,
        markdown: limpiarCuerpo(r.cuerpo),
        animo: animoDeMeta(meta.mood),
        categoria,
        etiquetas: etiquetasDeMeta(meta),
        favorita: meta.favorite === true || meta.starred === true,
        fijada: meta.pinned === true,
        imagenes: r.imagenes,
      }),
    );
  }
  for (const camino of categorias.keys()) p.categorias.push({ camino, color: null });
  if (noImagenes) p.avisos.push(`${noImagenes} archivos de las notas no se importaron (tipo no admitido)`);
  return p;
}
