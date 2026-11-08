// Asistente del diario (lane 298): el texto que ven el modelo como resultado de cada herramienta. Reglas puras (sin base): reciben datos ya leídos.
// Portado de vendor/moodiary/.../data/assistant_tools.dart (`_formatSearchRows`, `_formatDiaryFull`, `_diaryOverview`, `_listCategories`, `runBatch`,
// `_batchResult`, `_emptyQueryMessage`; ZhuJHua/moodiary@2c552dd). El formato `clave=valor` es el mismo para que las citas y los resúmenes lo lean igual.

import { MAX_ESCRITURA, MAX_EXTRACTO, MAX_TEXTO_COMPLETO, PREFIJO_FALLO, itemsDe } from "./herramientas.ts";

type Objeto = Record<string, unknown>;

export interface EntradaPlana {
  id: number;
  fecha: string;
  titulo: string | null;
  texto: string;
  animo: number | null;
  categoriaId: number | null;
  etiquetas?: string[];
}

/** «Bien (4)» con el nombre que la persona le puso al nivel; «not recorded» si no hay ánimo. */
export const textoDeAnimo = (animo: number | null, nombres: ReadonlyMap<number, string>): string => (animo === null ? "not recorded" : `${nombres.get(animo) ?? "?"} (${animo})`);

const tituloDe = (t: string | null) => (t?.trim() ? t.trim() : "Untitled");
const unaLinea = (s: string) => s.replace(/\s+/g, " ").trim();

/** moodiary `_formatSearchRows`. */
export function formatearBusqueda(filas: EntradaPlana[], total: number, nombres: ReadonlyMap<number, string>): string {
  const lineas: string[] = [filas.length < total ? `${total} matches; the first ${filas.length} follow. Raise limit or narrow the filters for more.` : `${total} matches:`];
  for (const e of filas) {
    const cat = e.categoriaId !== null ? ` categoryId=${e.categoriaId}` : "";
    lineas.push(`id=${e.id} 【${e.fecha}】${tituloDe(e.titulo)} mood=${textoDeAnimo(e.animo, nombres)}${cat}`);
    const texto = unaLinea(e.texto);
    if (texto) lineas.push(texto.length > MAX_EXTRACTO ? `${texto.slice(0, MAX_EXTRACTO)}… (excerpt; full text via getDiary)` : texto);
    lineas.push("");
  }
  return lineas.join("\n").trim();
}

/** moodiary `_formatDiaryFull`. */
export function formatearEntrada(e: EntradaPlana, nombres: ReadonlyMap<number, string>): string {
  const lineas = [`id=${e.id}`, `date=${e.fecha}`, `title=${tituloDe(e.titulo)}`, `mood=${textoDeAnimo(e.animo, nombres)}`];
  if (e.categoriaId !== null) lineas.push(`categoryId=${e.categoriaId}`);
  if (e.etiquetas?.length) lineas.push(`tags=${e.etiquetas.join(", ")}`);
  const texto = e.texto.trim();
  lineas.push("body:", !texto ? "(empty)" : texto.length > MAX_TEXTO_COMPLETO ? `${texto.slice(0, MAX_TEXTO_COMPLETO)}… (truncated, ${texto.length - MAX_TEXTO_COMPLETO} more characters)` : texto);
  return lineas.join("\n").trim();
}

/** moodiary `_getDiary`: las entradas leídas, las que no se encontraron y el aviso de tope. */
export function formatearLectura(leidas: string[], faltantes: string[], pedidas: number, tope: number): string {
  const partes: string[] = [];
  if (faltantes.length) partes.push(`Not found (deleted, or the id is wrong — recheck with searchDiaries): ${faltantes.join(", ")}`);
  if (pedidas > tope) partes.push(`(Only the first ${tope} were read; call again for the rest.)`);
  const cabeza = partes.join("\n");
  const cuerpo = leidas.join("\n\n---\n\n");
  const todo = [cabeza, cuerpo].filter(Boolean).join("\n\n").trim();
  return todo || `${PREFIJO_FALLO} none of those ids match a diary.`;
}

export interface DatosResumen {
  total: number;
  desde: string | null;
  hasta: string | null;
  porCategoria: { id: number; nombre: string; cantidad: number }[];
  sinCategoria: number;
  porAnimo: Map<number | null, number>;
}

/** moodiary `_diaryOverview`. */
export function formatearResumen(d: DatosResumen, nombres: ReadonlyMap<number, string>): string {
  if (d.total === 0) return "No diaries yet.";
  const lineas = [`Total entries=${d.total}`];
  if (d.desde && d.hasta) lineas.push(`span=${d.desde} ~ ${d.hasta}`);
  lineas.push("by category:");
  if (!d.porCategoria.length) lineas.push("- (all uncategorised)");
  else for (const c of [...d.porCategoria].sort((a, b) => b.cantidad - a.cantidad)) lineas.push(`- ${c.nombre} (id=${c.id}): ${c.cantidad}`);
  if (d.sinCategoria > 0) lineas.push(`- uncategorised: ${d.sinCategoria}`);
  lineas.push("mood distribution (null means not recorded):");
  const niveles = [...nombres.keys()].sort((a, b) => a - b);
  lineas.push(`- ${[...niveles.map((n) => `${nombres.get(n)} (${n})=${d.porAnimo.get(n) ?? 0}`), `not recorded=${d.porAnimo.get(null) ?? 0}`].join(", ")}`);
  return lineas.join("\n");
}

export function formatearCategorias(cats: { id: number; nombre: string; padreId: number | null; usos: number }[]): string {
  if (!cats.length) return "No categories yet.";
  return cats.map((c) => `id=${c.id} name=${c.nombre}${c.padreId !== null ? ` parentId=${c.padreId}` : ""} entries=${c.usos}`).join("\n");
}

/** moodiary `_emptyQueryMessage`. */
export function mensajeSinResultados(c: { consulta: string; categoria: string | null; desde: string | null; hasta: string | null }): string {
  const condiciones = [c.consulta ? `keywords "${c.consulta}"` : "", c.categoria ? `category "${c.categoria}"` : "", c.desde ? `from ${c.desde}` : "", c.hasta ? `to ${c.hasta}` : ""].filter(Boolean);
  return condiciones.length ? `No diaries match ${condiciones.join(", ")}.` : "No diaries yet.";
}

const sinPrefijo = (l: string) => (l.startsWith(PREFIJO_FALLO) ? l.slice(PREFIJO_FALLO.length).trim() : l);

/**
 * moodiary `runBatch` + `_batchResult`: una línea por elemento; si alguno falla, el resto igual se hace y el modelo ve cuáles. Si todos fallan, un solo `Failed:`.
 * `cada` devuelve el texto de éxito o una línea que empieza con `Failed:`; si lanza, se convierte en un `Failed:` de ese elemento.
 */
export async function ejecutarLote(entrada: Objeto, cada: (item: Objeto, indice: number) => Promise<string>, tope = MAX_ESCRITURA): Promise<string> {
  const items = itemsDe(entrada);
  if (!items.length) return `${PREFIJO_FALLO} no items given.`;
  const hechas: string[] = [];
  const falladas: string[] = [];
  let n = 0;
  for (const item of items.slice(0, tope)) {
    n++;
    let linea: string;
    try {
      linea = await cada(item, n);
    } catch (e) {
      const id = item.id;
      linea = `${PREFIJO_FALLO} ${id === undefined ? `item ${n}` : `id=${String(id)}`} ${e instanceof Error ? e.message : String(e)}`;
    }
    (linea.startsWith(PREFIJO_FALLO) ? falladas : hechas).push(linea);
  }
  const cola = items.length > tope ? `\n(Only the first ${tope} were processed; call again for the rest.)` : "";
  if (!hechas.length) return `${PREFIJO_FALLO} ${falladas.map(sinPrefijo).filter(Boolean).join(" ")}`.trim() + cola;
  return [...hechas, ...falladas].join("\n") + cola;
}
