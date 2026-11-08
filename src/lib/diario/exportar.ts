// Diario (lane 291): exportar el diario a Markdown, CSV y JSON. Reglas puras: sin base, sin red.
// Portado de vendor/Daily_You/lib/utils/exports/{export_snapshot,export_json,export_csv,export_markdown,export_naming}.dart (Demizo/Daily_You@7cc237d)
// y de vendor/moodiary/packages/feature/moodiary_export/lib/src/data/{tiptap_to_ir,markdown_writer}.dart (ZhuJHua/moodiary@2c552dd).
import type { NodoDoc } from "./contenido.ts";

export type FormatoExport = "markdown" | "csv" | "json";
export const FORMATOS_EXPORT: { valor: FormatoExport; titulo: string; detalle: string }[] = [
  { valor: "markdown", titulo: "Markdown", detalle: "Una nota por entrada, con sus fotos." },
  { valor: "csv", titulo: "CSV", detalle: "Una fila por entrada, para una planilla." },
  { valor: "json", titulo: "JSON", detalle: "Copia completa, para volver a importarla." },
];
export const esFormatoExport = (v: unknown): v is FormatoExport => v === "markdown" || v === "csv" || v === "json";

export const FORMATO_JSON = "ordo-diei-diario";
export const VERSION_JSON = 1;
/** Entradas por exportación y bytes de fotos (el límite de la función en Vercel). */
export const MAX_ENTRADAS_EXPORT = 20_000;
export const MAX_BYTES_FOTOS_EXPORT = 150 * 1024 * 1024;

// ── Datos que se exportan ────────────────────────────────────────────────────

export interface EtiquetaExport {
  nombre: string;
  tipo: "etiqueta" | "contador";
  valor: string | null;
}

export interface EntradaExport {
  /** "YYYY-MM-DD" en la zona de la familia. */
  fecha: string;
  /** Minutos desde la medianoche. */
  hora: number;
  titulo: string | null;
  texto: string;
  contenido: NodoDoc | null;
  animo: number | null;
  /** «Fe › Misa»: la categoría con sus madres. */
  categoria: string | null;
  etiquetas: EtiquetaExport[];
  favorita: boolean;
  fijada: boolean;
  autor: string;
  creadaEn: string;
  editadaEn: string;
  /** URLs `/api/archivos/<uuid>` de las fotos de la entrada y de las imágenes del documento, sin repetir. */
  fotos: string[];
}

export interface NivelExport {
  valor: number;
  etiqueta: string | null;
  icono: string | null;
  tipoIcono: "emoji" | "icono";
  color: string | null;
}

export interface CatalogoExport {
  escala: NivelExport[];
  /** Categorías de etiquetas (Daily You `TagCategory`). */
  grupos: { nombre: string; icono: string | null; tipoIcono: "emoji" | "icono"; color: string | null; seleccionUnica: boolean; orden: number }[];
  categorias: { nombre: string; camino: string; color: string | null }[];
  etiquetas: { nombre: string; tipo: "etiqueta" | "contador"; grupo: string | null; icono: string | null; tipoIcono: "emoji" | "icono"; color: string | null; orden: number }[];
}

export interface DatosExport {
  tipo: "personal" | "familiar";
  exportadaEn: string;
  catalogo: CatalogoExport;
  entradas: EntradaExport[];
}

// ── Nombres (Daily You `nameExportEntries`) ──────────────────────────────────

export interface EntradaNombrada {
  entrada: EntradaExport;
  /** `2026-07-20`, o `2026-07-20_2` si ese día hay más de una. */
  nombre: string;
  /** Ruta dentro del ZIP de cada foto (misma posición que `entrada.fotos`); con extensión si se dio `extensionDe`. */
  fotos: string[];
}

export const CARPETA_FOTOS = "fotos";

/** Las entradas por fecha y hora (Daily You las ordena por fecha de creación). */
export const ordenarCronologicas = (entradas: EntradaExport[]): EntradaExport[] =>
  [...entradas].sort((a, b) => (a.fecha === b.fecha ? a.hora - b.hora || a.creadaEn.localeCompare(b.creadaEn) : a.fecha < b.fecha ? -1 : 1));

export function nombrarEntradas(entradas: EntradaExport[], extensionDe?: (url: string) => string): EntradaNombrada[] {
  const porDia = new Map<string, number>();
  return ordenarCronologicas(entradas).map((entrada) => {
    const n = (porDia.get(entrada.fecha) ?? 0) + 1;
    porDia.set(entrada.fecha, n);
    const nombre = n > 1 ? `${entrada.fecha}_${n}` : entrada.fecha;
    return { entrada, nombre, fotos: entrada.fotos.map((url, i) => `${CARPETA_FOTOS}/foto_${nombre}_${i + 1}${extensionDe ? `.${extensionDe(url)}` : ""}`) };
  });
}

/** Extensión de archivo para un tipo de imagen. */
export function extensionDeImagen(mime: string): string {
  const m = mime.split(";")[0].trim().toLowerCase();
  return ({ "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/avif": "avif", "image/heic": "heic", "image/heif": "heif" } as Record<string, string>)[m] ?? "bin";
}

// ── Textos ───────────────────────────────────────────────────────────────────

const dos = (n: number) => String(n).padStart(2, "0");
export const horaTexto = (min: number) => `${dos(Math.floor(min / 60))}:${dos(min % 60)}`;
/** `2026-07-20T09:30` (sin zona: es la hora de la familia). */
export const fechaHora = (fecha: string, hora: number) => `${fecha}T${horaTexto(hora)}`;

export function nombreDeAnimo(escala: NivelExport[], animo: number | null): string | null {
  if (animo === null) return null;
  const n = escala.find((x) => x.valor === animo);
  if (n?.etiqueta?.trim()) return n.etiqueta.trim();
  return ({ 1: "Muy mal", 2: "Mal", 3: "Normal", 4: "Bien", 5: "Muy bien" } as Record<number, string>)[animo] ?? String(animo);
}

// ── Markdown (moodiary `MarkdownWriter`) ─────────────────────────────────────

export interface OpcionesMarkdown {
  /** URL de la imagen en el Markdown (ruta relativa dentro del ZIP o la misma URL). */
  rutaDeImagen: (src: string) => string;
}

const escapar = (t: string) => t.replace(/[\\`*_[\]<=]/g, (c) => `\\${c}`);
const escaparUrl = (u: string) => u.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29");
const largoValla = (t: string, minimo: number) => {
  const mayor = Math.max(0, ...(t.match(/`+/g) ?? []).map((s) => s.length));
  return Math.max(minimo, mayor + 1);
};

interface Tramo {
  texto: string;
  marcas: Set<string>;
  href: string | null;
  enlaceEntrada: string | null;
}

/** moodiary `_inline`: junta tramos vecinos con el mismo estilo. */
function tramosDe(nodos: NodoDoc[] | undefined): Tramo[] {
  const salida: Tramo[] = [];
  const agregar = (t: Tramo) => {
    if (!t.texto) return;
    const u = salida[salida.length - 1];
    const igual = u && u.href === t.href && u.enlaceEntrada === t.enlaceEntrada && u.marcas.size === t.marcas.size && [...t.marcas].every((m) => u.marcas.has(m));
    if (igual) u.texto += t.texto;
    else salida.push(t);
  };
  for (const n of nodos ?? []) {
    if (n.type === "text") {
      const marcas = new Set<string>();
      let href: string | null = null;
      for (const m of n.marks ?? []) {
        if (m.type === "link") href = typeof m.attrs?.href === "string" ? m.attrs.href : null;
        else marcas.add(m.type);
      }
      agregar({ texto: n.text ?? "", marcas, href, enlaceEntrada: null });
    } else if (n.type === "hardBreak") agregar({ texto: "\n", marcas: new Set(), href: null, enlaceEntrada: null });
    else if (n.type === "diaryLink") {
      const rotulo = String(n.attrs?.label ?? "").trim();
      agregar({ texto: rotulo || "Entrada sin título", marcas: new Set(), href: null, enlaceEntrada: String(n.attrs?.id ?? "") || null });
    }
  }
  return salida;
}

function tramoAMarkdown(t: Tramo): string {
  if (t.enlaceEntrada) return `[[${t.texto}]]`;
  if (t.marcas.has("code")) {
    const valla = "`".repeat(largoValla(t.texto, 1));
    const pad = t.texto.startsWith("`") || t.texto.endsWith("`") ? " " : "";
    return `${valla}${pad}${t.texto}${pad}${valla}`;
  }
  let s = escapar(t.texto).replace(/\n/g, "\\\n");
  if (t.marcas.has("bold")) s = `**${s}**`;
  if (t.marcas.has("italic")) s = `*${s}*`;
  if (t.marcas.has("strike")) s = `~~${s}~~`;
  if (t.marcas.has("highlight")) s = `==${s}==`;
  if (t.marcas.has("underline")) s = `<u>${s}</u>`;
  if (t.href) s = `[${s}](${escaparUrl(t.href)})`;
  return s;
}

const inline = (nodos: NodoDoc[] | undefined) => tramosDe(nodos).map(tramoAMarkdown).join("");
const lineas = (t: string) => {
  const r = t.trimEnd();
  return r ? r.split("\n") : [];
};

function celda(n: NodoDoc, o: OpcionesMarkdown): string {
  return bloques(n.content, o, true).trim().replace(/\n/g, " ").replace(/\|/g, "\\|");
}

function tabla(filas: NodoDoc[], o: OpcionesMarkdown): string {
  const matriz = filas.map((f) => (f.content ?? []).filter((c) => c.type === "tableCell" || c.type === "tableHeader").map((c) => celda(c, o)));
  if (!matriz.length) return "";
  const ancho = Math.max(...matriz.map((f) => f.length));
  const fila = (f: string[]) => `| ${Array.from({ length: ancho }, (_, i) => f[i] ?? "").join(" | ")} |`;
  return [fila(matriz[0]), `|${" --- |".repeat(ancho)}`, ...matriz.slice(1).map(fila)].join("\n");
}

function lista(n: NodoDoc, o: OpcionesMarkdown): string {
  const ordenada = n.type === "orderedList";
  let numero = typeof n.attrs?.start === "number" ? n.attrs.start : 1;
  const salida: string[] = [];
  for (const item of n.content ?? []) {
    if (item.type !== "listItem" && item.type !== "taskItem") continue;
    const marca = ordenada ? `${numero++}.` : "-";
    const caja = item.type === "taskItem" ? (item.attrs?.checked === true ? "[x] " : "[ ] ") : "";
    const interno = lineas(bloques(item.content, o, true));
    if (!interno.length) {
      salida.push(`${marca} ${caja}`);
      continue;
    }
    salida.push(`${marca} ${caja}${interno[0]}`);
    const sangria = " ".repeat(marca.length + 1);
    for (const l of interno.slice(1)) salida.push(l ? `${sangria}${l}` : "");
  }
  return salida.join("\n");
}

function bloque(n: NodoDoc, o: OpcionesMarkdown): string | null {
  switch (n.type) {
    case "paragraph": {
      const t = inline(n.content);
      return t.trim() ? t : "";
    }
    case "heading":
      return `${"#".repeat(Math.min(6, Math.max(1, Number(n.attrs?.level) || 1)))} ${inline(n.content)}`;
    case "blockquote":
      return lineas(bloques(n.content, o, false)).map((l) => (l ? `> ${l}` : ">")).join("\n");
    case "bulletList":
    case "orderedList":
    case "taskList":
      return lista(n, o);
    case "codeBlock": {
      const texto = (n.content ?? []).map((c) => c.text ?? "").join("");
      const valla = "`".repeat(largoValla(texto, 3));
      const lang = typeof n.attrs?.language === "string" ? n.attrs.language : "";
      return `${valla}${lang}\n${texto}\n${valla}`;
    }
    case "horizontalRule":
      return "---";
    case "image": {
      const src = typeof n.attrs?.src === "string" ? n.attrs.src : "";
      if (!src) return null;
      const alt = typeof n.attrs?.name === "string" ? escapar(n.attrs.name) : "";
      return `![${alt}](${o.rutaDeImagen(src)})`;
    }
    case "table":
      return tabla(n.content ?? [], o);
    default:
      return null;
  }
}

function bloques(nodos: NodoDoc[] | undefined, o: OpcionesMarkdown, apretado: boolean): string {
  const partes: string[] = [];
  const lista = nodos ?? [];
  lista.forEach((n, i) => {
    const b = bloque(n, o);
    if (b === null) return;
    // En una lista, un párrafo seguido de una sublista va pegado
    const pegado = apretado && n.type === "paragraph" && lista[i + 1] && /List$/.test(lista[i + 1].type);
    partes.push(b + (b === "" ? "\n" : pegado ? "\n" : "\n\n"));
  });
  return partes.join("");
}

/** moodiary `MarkdownWriter.write` (GFM) para un documento Tiptap. */
export function markdownDeDoc(doc: NodoDoc, o: OpcionesMarkdown): string {
  return bloques(doc.content, o, false).replace(/\n{3,}/g, "\n\n").trimEnd();
}

const yamlTexto = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
const yamlLista = (xs: string[]) => `[${xs.map(yamlTexto).join(", ")}]`;

/** Cuerpo de una entrada: el documento, o el texto plano si no tiene formato (moodiary: «no es JSON → un párrafo»). */
export function cuerpoMarkdown(e: EntradaExport, rutaDeImagen: (src: string) => string): string {
  if (e.contenido) return markdownDeDoc(e.contenido, { rutaDeImagen });
  return e.texto
    .split(/\r?\n/)
    .map((l) => escapar(l))
    .join("\n\n");
}

/** Una nota: front matter (Daily You) + título + cuerpo + las fotos que no están dentro del texto. */
export function notaMarkdown(n: EntradaNombrada, escala: NivelExport[], opciones: { conAutor: boolean }): string {
  const e = n.entrada;
  const rutas = new Map(e.fotos.map((f, i) => [f, n.fotos[i]]));
  const rutaDeImagen = (src: string) => rutas.get(src) ?? src;
  const enTexto = new Set<string>();
  const cuerpo = e.contenido
    ? markdownDeDoc(e.contenido, {
        rutaDeImagen: (src) => {
          enTexto.add(src);
          return rutaDeImagen(src);
        },
      })
    : cuerpoMarkdown(e, rutaDeImagen);
  const contadores = Object.fromEntries(e.etiquetas.filter((t) => t.tipo === "contador" && t.valor !== null).map((t) => [t.nombre, Number.isFinite(Number(t.valor)) ? Number(t.valor) : t.valor]));
  const etiquetas = e.etiquetas.filter((t) => t.tipo === "etiqueta").map((t) => t.nombre);
  const campos: [string, string][] = [["date", yamlTexto(fechaHora(e.fecha, e.hora))]];
  if (e.titulo) campos.push(["title", yamlTexto(e.titulo)]);
  if (e.animo !== null) campos.push(["mood", String(e.animo)], ["moodLabel", yamlTexto(nombreDeAnimo(escala, e.animo) ?? "")]);
  if (e.categoria) campos.push(["category", yamlTexto(e.categoria)]);
  if (etiquetas.length) campos.push(["tags", yamlLista(etiquetas)]);
  if (Object.keys(contadores).length) campos.push(["trackers", JSON.stringify(contadores)]);
  if (e.favorita) campos.push(["favorite", "true"]);
  if (e.fijada) campos.push(["pinned", "true"]);
  if (opciones.conAutor) campos.push(["author", yamlTexto(e.autor)]);
  const frente = ["---", ...campos.map(([k, v]) => `${k}: ${v}`), "---", ""].join("\n");
  const sueltas = e.fotos.filter((f) => !enTexto.has(f)).map((f) => `![](${rutaDeImagen(f)})`);
  return [frente, e.titulo ? `# ${escapar(e.titulo)}\n` : "", sueltas.length ? `${sueltas.join("\n\n")}\n` : "", cuerpo, ""].filter((p, i) => i !== 1 || p).join("\n");
}

/** Todo en un solo Markdown (moodiary `ExportCommon.merge`): cada entrada con su título de fecha. */
export function markdownUnido(nombradas: EntradaNombrada[], escala: NivelExport[], conAutor: boolean): string {
  return nombradas
    .map((n) => {
      const e = n.entrada;
      const animo = nombreDeAnimo(escala, e.animo);
      const meta = [horaTexto(e.hora), animo, e.categoria, conAutor ? e.autor : null].filter(Boolean).join(" · ");
      const rutas = new Map(e.fotos.map((f, i) => [f, n.fotos[i]]));
      const cuerpo = cuerpoMarkdown(e, (src) => rutas.get(src) ?? src);
      return [`## ${e.fecha}${e.titulo ? ` · ${escapar(e.titulo)}` : ""}`, `*${meta}*`, cuerpo].filter(Boolean).join("\n\n");
    })
    .join("\n\n---\n\n")
    .concat("\n");
}

// ── CSV (Daily You `export_csv.dart`) ────────────────────────────────────────

const COLUMNAS_CSV = ["date", "modified", "mood", "moodLabel", "title", "text", "category", "tags", "attachments"];
const PREFIJO_CONTADOR = "tracker:";

/** RFC 4180: comillas si hay coma, comilla o salto de línea. Además se neutralizan las fórmulas (`=`, `+`, `-`, `@`) para que la planilla no las ejecute. */
export function celdaCsv(v: string | number | null): string {
  if (v === null) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvDeEntradas(nombradas: EntradaNombrada[], catalogo: CatalogoExport): string {
  const contadores = catalogo.etiquetas.filter((t) => t.tipo === "contador").map((t) => t.nombre);
  const filas: (string | number | null)[][] = [
    [...COLUMNAS_CSV, ...contadores.map((c) => `${PREFIJO_CONTADOR}${c}`)],
    ...nombradas.map(({ entrada: e, fotos }) => {
      const valores = new Map(e.etiquetas.filter((t) => t.tipo === "contador").map((t) => [t.nombre, t.valor]));
      return [
        fechaHora(e.fecha, e.hora),
        e.editadaEn,
        e.animo,
        nombreDeAnimo(catalogo.escala, e.animo),
        e.titulo,
        e.texto,
        e.categoria,
        e.etiquetas.filter((t) => t.tipo === "etiqueta").map((t) => t.nombre).join(", "),
        fotos.join(", "),
        ...contadores.map((c) => valores.get(c) ?? null),
      ];
    }),
  ];
  return `﻿${filas.map((f) => f.map(celdaCsv).join(",")).join("\r\n")}\r\n`;
}

/** Copia del documento con el `src` de cada imagen cambiado por `nuevo(src)`; con `null` la imagen se quita. */
export function reescribirImagenes(doc: NodoDoc, nuevo: (src: string) => string | null): NodoDoc {
  const recorrer = (n: NodoDoc): NodoDoc[] => {
    if (n.type === "image" && typeof n.attrs?.src === "string") {
      const src = nuevo(n.attrs.src);
      return src === null ? [] : [{ ...n, attrs: { ...n.attrs, src } }];
    }
    return [n.content ? { ...n, content: n.content.flatMap(recorrer) } : n];
  };
  return recorrer(doc)[0] ?? { type: "doc", content: [] };
}

// ── JSON (Daily You `export_json.dart`) ──────────────────────────────────────

export function documentoJson(datos: DatosExport, nombradas: EntradaNombrada[], conFotos: boolean): Record<string, unknown> {
  return {
    format: FORMATO_JSON,
    version: VERSION_JSON,
    diario: datos.tipo,
    exportedAt: datos.exportadaEn,
    moodScale: datos.catalogo.escala.map((n) => ({ mood: n.valor, label: n.etiqueta, icon: n.icono, iconType: n.tipoIcono, color: n.color })),
    tagGroups: datos.catalogo.grupos.map((g) => ({ name: g.nombre, icon: g.icono, iconType: g.tipoIcono, color: g.color, singleChoice: g.seleccionUnica, sortOrder: g.orden })),
    categories: datos.catalogo.categorias.map((c) => ({ name: c.nombre, path: c.camino, color: c.color })),
    tags: datos.catalogo.etiquetas.map((t) => ({ name: t.nombre, type: t.tipo, group: t.grupo, icon: t.icono, iconType: t.tipoIcono, color: t.color, sortOrder: t.orden })),
    entries: nombradas.map(({ entrada: e, fotos }) => {
      // Con fotos, las imágenes del documento apuntan a su archivo dentro del ZIP (si no, quedan con su URL)
      const rutas = new Map(e.fotos.map((f, i) => [f, fotos[i]]));
      return {
      date: e.fecha,
      time: horaTexto(e.hora),
      title: e.titulo,
      text: e.texto,
      content: e.contenido && conFotos ? reescribirImagenes(e.contenido, (src) => rutas.get(src) ?? src) : e.contenido,
      mood: e.animo,
      category: e.categoria,
      tags: e.etiquetas.map((t) => ({ name: t.nombre, type: t.tipo, value: t.valor })),
      favorite: e.favorita,
      pinned: e.fijada,
      author: e.autor,
      created: e.creadaEn,
      modified: e.editadaEn,
      photos: conFotos ? fotos : [],
      };
    }),
  };
}

// ── Nombre del archivo descargado ────────────────────────────────────────────

export function nombreDeArchivo(formato: FormatoExport, tipo: string, hoy: string, esZip: boolean): string {
  const base = `ordo-diei-diario-${tipo}-${hoy}`;
  if (esZip) return `${base}.zip`;
  return `${base}.${formato === "markdown" ? "md" : formato}`;
}
