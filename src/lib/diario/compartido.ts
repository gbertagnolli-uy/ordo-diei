// Diario (lane 293): reglas puras de compartir — la entrada como Markdown y el texto que llega desde otra app. Sin base ni red, con tests.
// Portado de vendor/moodiary/packages/feature/moodiary_export/lib/src/presentation/share_sheet.dart (ZhuJHua/moodiary@2c552dd): compartir una entrada como Markdown
// (acá sin las imágenes: sus enlaces no sirven fuera de la sesión) y de vendor/Daily_You/lib/pages/share_page.dart (Demizo/Daily_You@7cc237d): lo que otra app
// comparte (texto, título) se agrega al diario eligiendo el día; si ese día ya tiene una entrada se puede agregar a ella o crear una nueva.
import { markdownDeDoc } from "./exportar.ts";
import { VERSION_DOC, docDesdeTexto, type NodoDoc } from "./contenido.ts";
import { FECHA_MINIMA, MAX_TEXTO, MAX_TITULO } from "./reglas.ts";

// ── Markdown para compartir ──────────────────────────────────────────────────

function sinImagenes(nodos: NodoDoc[] | undefined): NodoDoc[] | undefined {
  if (!nodos) return nodos;
  return nodos.filter((n) => n.type !== "image").map((n) => (n.content ? { ...n, content: sinImagenes(n.content) } : n));
}

export interface EntradaParaCompartir {
  fecha: string;
  /** Minutos desde la medianoche. */
  hora: number;
  titulo: string | null;
  texto: string;
  contenido: NodoDoc | null;
  animo: string | null;
  categoria: string | null;
  etiquetas: string[];
}

const dos = (n: number) => String(n).padStart(2, "0");

/** Una entrada como Markdown: título, una línea con fecha, hora, ánimo, categoría y etiquetas, y el cuerpo sin imágenes. */
export function markdownParaCompartir(e: EntradaParaCompartir): string {
  const partes: string[] = [];
  if (e.titulo?.trim()) partes.push(`# ${e.titulo.trim()}`);
  const meta = [`${e.fecha} ${dos(Math.floor(e.hora / 60))}:${dos(e.hora % 60)}`, e.animo, e.categoria, ...e.etiquetas.map((t) => `#${t}`)].filter((x): x is string => !!x);
  partes.push(`*${meta.join(" · ")}*`);
  const cuerpo = e.contenido ? markdownDeDoc({ ...e.contenido, content: sinImagenes(e.contenido.content) }, { rutaDeImagen: () => "" }) : e.texto.trim();
  if (cuerpo.trim()) partes.push(cuerpo.trim());
  return partes.join("\n\n") + "\n";
}

/** Nombre del archivo `.md` o `.png` al guardar: «diario-2026-11-08-0805». */
export const nombreDeCompartido = (fecha: string, hora: number, extension: "png" | "md"): string => `diario-${fecha}-${dos(Math.floor(hora / 60))}${dos(hora % 60)}.${extension}`;

// ── Texto que llega desde otra app ───────────────────────────────────────────

export interface Compartido {
  titulo: string | null;
  texto: string;
}

const MAX_CRUDO = 20_000;
const unParametro = (v: string | null) => (v ?? "").slice(0, MAX_CRUDO).replace(/\r\n?/g, "\n").trim();

/**
 * Lo que dejó el `share_target` del manifiesto (`title`, `text`, `url`). Android suele mandar el enlace dentro de `text`;
 * si viene aparte y no está en el texto, se agrega al final.
 */
export function leerCompartido(p: { get(nombre: string): string | null }): Compartido {
  const titulo = unParametro(p.get("title")).replace(/\s+/g, " ").slice(0, MAX_TITULO).trim();
  let texto = unParametro(p.get("text"));
  const url = unParametro(p.get("url"));
  if (url && !texto.includes(url)) texto = texto ? `${texto}\n${url}` : url;
  return { titulo: titulo || null, texto: texto.slice(0, MAX_TEXTO).trim() };
}

export const hayCompartido = (c: Compartido): boolean => c.texto.length > 0 || c.titulo !== null;

const RE_ENLACE = /https?:\/\/[^\s<>"]+/gi;

/** Un párrafo de texto: los enlaces `http(s)` quedan como enlaces (sin el punto o la coma de cierre). */
function parrafo(linea: string): NodoDoc {
  if (!linea) return { type: "paragraph" };
  const contenido: NodoDoc[] = [];
  let desde = 0;
  for (const m of linea.matchAll(RE_ENLACE)) {
    const url = m[0].replace(/[.,;:!?)\]]+$/, "");
    if (m.index > desde) contenido.push({ type: "text", text: linea.slice(desde, m.index) });
    contenido.push({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] });
    desde = m.index + url.length;
  }
  if (desde < linea.length) contenido.push({ type: "text", text: linea.slice(desde) });
  return { type: "paragraph", content: contenido };
}

/** El texto compartido como párrafos de un documento, con los enlaces activos. */
export const docDeCompartido = (texto: string): NodoDoc => ({ type: "doc", attrs: { v: VERSION_DOC }, content: texto.split("\n").map(parrafo) });

/** Daily You: agrega lo compartido al final de una entrada que ya existe (su documento, o su texto plano si no tiene formato). */
export function agregarADocumento(existente: { contenido: NodoDoc | null; texto: string }, texto: string): NodoDoc {
  const base = existente.contenido ?? docDesdeTexto(existente.texto);
  const nuevo = docDeCompartido(texto).content ?? [];
  return { ...base, content: [...(base.content ?? []), ...nuevo] };
}

/** ¿Se puede escribir en ese día? Entre 2000-01-01 y hoy, en formato "YYYY-MM-DD". */
export function diaValido(fecha: string, hoy: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(`${fecha}T00:00:00Z`))) return false;
  if (new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha) return false;
  return fecha >= FECHA_MINIMA && fecha <= hoy;
}

/** Lo que se muestra de lo compartido: el título y las primeras líneas. */
export function vistaPreviaCompartida(c: Compartido, lineas = 6): string {
  const partes = c.texto.split("\n");
  return partes.slice(0, lineas).join("\n") + (partes.length > lineas ? "\n…" : "");
}
