// Diario (lane 285): reglas puras de búsqueda, filtros, orden, resaltado, extracto e historial. Sin base de datos, con tests.
// Portado de vendor/Daily_You/lib/utils/{search_matcher,search_highlight,search_text_window}.dart y lib/providers/entries_provider.dart (Demizo/Daily_You@7cc237d):
//   coincidencia sin mayúsculas, resaltado, ventana de texto y orden por fecha / ánimo / contador con sentido.
// De vendor/moodiary/packages/feature/moodiary_diary/lib/src/application/search_controller.dart, vendor/moodiary/packages/feature_base/moodiary_models/lib/src/search.dart
//   y vendor/moodiary/packages/feature_base/moodiary_data/lib/src/diary_repository.dart (ZhuJHua/moodiary@2c552dd):
//   términos en AND, pesos título 1,5 / cuerpo 1,0, extracto de 24 palabras, presets de fecha, página de 30 e historial de 12.
// De vendor/storypad/lib/core/objects/search_filter_object.dart (theachoem/storypad@a76825e): años, etiquetas, favorita y fijada (tri-estado).
import { FECHA_MINIMA } from "./reglas.ts";

export const PAGINA = 30;
export const MAX_PAGINA = 100;
/** Candidatas que el servidor compara con el texto (ver B1 de la lane 285). */
export const MAX_CANDIDATAS = 5000;
export const MAX_CONSULTA = 200;
export const MAX_TERMINOS = 8;
export const MAX_HISTORIAL = 12;
export const ESPERA_MS = 400;
const MAX_LISTA = 50;
/** moodiary: `bm25(weights: [1.5, 1.0])`, el título pesa más que el cuerpo. */
const PESO_TITULO = 1.5;
const PESO_TEXTO = 1.0;
/** moodiary: `snippet(..., tokenCount: 24)`. */
const PALABRAS_EXTRACTO = 24;
const PALABRAS_ANTES = 8;

export type Orden = "relevancia" | "fecha" | "animo" | "contador";
export type Sentido = "desc" | "asc";
export type ModoEtiquetas = "alguna" | "todas" | "ninguna";
export type PresetFecha = "todo" | "7dias" | "30dias" | "anio" | "rango";

export interface FiltroBusqueda {
  consulta: string;
  etiquetas: number[];
  /** Daily You / storypad: con alguna de las elegidas, con todas, o entradas sin ninguna etiqueta. */
  etiquetaModo: ModoEtiquetas;
  /** moodiary `DiaryFilter.category`: la categoría y sus hijas. */
  categoriaId: number | null;
  /** moodiary `DiaryFilter.uncategorized`. */
  sinCategoria: boolean;
  animos: number[];
  /** storypad `starred` / `pinned`: tri-estado (null = sin filtro). */
  favorita: boolean | null;
  fijada: boolean | null;
  desde: string | null;
  hasta: string | null;
  anios: number[];
  orden: Orden;
  sentido: Sentido;
  /** Etiqueta contador por la que se ordena (Daily You `trackerSortTagId`). */
  contadorId: number | null;
  desplazamiento: number;
  limite: number;
}

export const FILTRO_VACIO: FiltroBusqueda = {
  consulta: "",
  etiquetas: [],
  etiquetaModo: "alguna",
  categoriaId: null,
  sinCategoria: false,
  animos: [],
  favorita: null,
  fijada: null,
  desde: null,
  hasta: null,
  anios: [],
  orden: "fecha",
  sentido: "desc",
  contadorId: null,
  desplazamiento: 0,
  limite: PAGINA,
};

// ── Texto ───────────────────────────────────────────────────────────────────

/** Minúsculas y sin tildes (ñ→n, ç→c). Una sola pieza por carácter, para poder volver a las posiciones originales. */
const plegar = (c: string) => c.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

export const normalizar = (s: string): string => {
  let r = "";
  for (const c of s) r += plegar(c);
  return r;
};

interface Mapeado {
  norm: string;
  /** Para cada unidad de `norm`: dónde empieza y dónde termina su carácter en el texto original. */
  ini: number[];
  fin: number[];
}

function normalizarConMapa(texto: string): Mapeado {
  let norm = "";
  const ini: number[] = [];
  const fin: number[] = [];
  let i = 0;
  for (const c of texto) {
    const n = plegar(c);
    for (let k = 0; k < n.length; k++) {
      ini.push(i);
      fin.push(i + c.length);
    }
    norm += n;
    i += c.length;
  }
  return { norm, ini, fin };
}

export interface ConsultaPreparada {
  terminos: string[];
  /** La consulta entera, normalizada y con los espacios colapsados (Daily You busca la frase completa). */
  frase: string;
}

export function prepararConsulta(consulta: string): ConsultaPreparada {
  const frase = normalizar(consulta).replace(/\s+/g, " ").trim();
  const terminos = [...new Set(frase.split(" ").filter(Boolean))].slice(0, MAX_TERMINOS);
  return { terminos, frase };
}

/** Daily You `textMatchesQuery` (subcadena sin mayúsculas ni tildes) y moodiary (todos los términos). */
export function coincide(titulo: string | null, texto: string, q: ConsultaPreparada): boolean {
  if (!q.terminos.length) return true;
  const pajar = `${normalizar(titulo ?? "")}\n${normalizar(texto)}`;
  return q.terminos.every((t) => pajar.includes(t));
}

function contar(pajar: string, aguja: string): number {
  let n = 0;
  for (let i = pajar.indexOf(aguja); i >= 0; i = pajar.indexOf(aguja, i + aguja.length)) n++;
  return n;
}

/** Más alto = más relevante. Título 1,5 y cuerpo 1,0 por aparición (con tope), más un premio si está la frase entera. */
export function puntuar(titulo: string | null, texto: string, q: ConsultaPreparada): number {
  const nt = normalizar(titulo ?? "");
  const nx = normalizar(texto);
  let p = 0;
  for (const t of q.terminos) p += PESO_TITULO * Math.min(contar(nt, t), 5) + PESO_TEXTO * Math.min(contar(nx, t), 10);
  if (q.terminos.length > 1 && q.frase) {
    if (nt.includes(q.frase)) p += PESO_TITULO * 3;
    if (nx.includes(q.frase)) p += PESO_TEXTO * 1.5;
  }
  return p;
}

// ── Resaltado y extracto ────────────────────────────────────────────────────

export interface Rango {
  inicio: number;
  fin: number;
}
export interface Segmento {
  texto: string;
  coincide: boolean;
}

/** Posiciones (en el texto original) de cada aparición de los términos, juntando las que se pisan o se tocan. Daily You `findMatches`. */
export function rangosCoincidencia(texto: string, terminos: string[]): Rango[] {
  if (!texto || !terminos.length) return [];
  const { norm, ini, fin } = normalizarConMapa(texto);
  const crudos: Rango[] = [];
  for (const t of terminos) {
    for (let i = norm.indexOf(t); i >= 0 && t; i = norm.indexOf(t, i + t.length)) {
      crudos.push({ inicio: ini[i], fin: fin[i + t.length - 1] });
    }
  }
  crudos.sort((a, b) => a.inicio - b.inicio || a.fin - b.fin);
  const unidos: Rango[] = [];
  for (const r of crudos) {
    const ult = unidos[unidos.length - 1];
    if (ult && r.inicio <= ult.fin) ult.fin = Math.max(ult.fin, r.fin);
    else unidos.push({ ...r });
  }
  return unidos;
}

/** moodiary `splitSearchHighlight`: el texto cortado en trozos, marcando cuáles son coincidencia (sin HTML). */
export function segmentar(texto: string, rangos: Rango[]): Segmento[] {
  const out: Segmento[] = [];
  let pos = 0;
  for (const r of rangos) {
    if (r.inicio > pos) out.push({ texto: texto.slice(pos, r.inicio), coincide: false });
    if (r.fin > r.inicio) out.push({ texto: texto.slice(r.inicio, r.fin), coincide: true });
    pos = Math.max(pos, r.fin);
  }
  if (pos < texto.length) out.push({ texto: texto.slice(pos), coincide: false });
  return out;
}

export const resaltar = (texto: string, terminos: string[]): Segmento[] => (texto ? segmentar(texto, rangosCoincidencia(texto, terminos)) : []);

/**
 * moodiary `snippet` (24 palabras, «…» donde se corta) y Daily You `searchTextWindow` (arranca un poco antes de la primera coincidencia).
 * Sin términos, devuelve el principio del texto.
 */
export function extracto(texto: string, terminos: string[], palabras = PALABRAS_EXTRACTO): Segmento[] {
  const piezas = [...texto.matchAll(/\S+/g)].map((m) => ({ ini: m.index ?? 0, fin: (m.index ?? 0) + m[0].length }));
  if (!piezas.length) return [];
  const rangos = rangosCoincidencia(texto, terminos);
  let primera = 0;
  if (rangos.length) {
    const idx = piezas.findIndex((p) => p.fin > rangos[0].inicio);
    primera = Math.max(0, (idx < 0 ? piezas.length - 1 : idx) - PALABRAS_ANTES);
  }
  const ultima = Math.min(piezas.length, primera + palabras);
  const desde = piezas[primera].ini;
  const hasta = piezas[ultima - 1].fin;
  const corte = texto.slice(desde, hasta);
  const recortados = rangos
    .filter((r) => r.fin > desde && r.inicio < hasta)
    .map((r) => ({ inicio: Math.max(r.inicio, desde) - desde, fin: Math.min(r.fin, hasta) - desde }));
  const segs = segmentar(corte, recortados);
  if (primera > 0) segs.unshift({ texto: "…", coincide: false });
  if (ultima < piezas.length) segs.push({ texto: "…", coincide: false });
  return segs;
}

// ── Orden ───────────────────────────────────────────────────────────────────

export interface Hallazgo {
  id: number;
  fecha: string;
  /** Minutos desde la medianoche. */
  hora: number;
  animo: number | null;
  /** Valor de la etiqueta contador elegida para ordenar. */
  valor: number | null;
  puntaje: number;
}

const masNuevaPrimero = (a: Hallazgo, b: Hallazgo) => b.fecha.localeCompare(a.fecha) || b.hora - a.hora || b.id - a.id;
const masViejaPrimero = (a: Hallazgo, b: Hallazgo) => a.fecha.localeCompare(b.fecha) || a.hora - b.hora || a.id - b.id;

/**
 * moodiary: relevancia → puntaje, luego más nueva. Daily You: fecha / ánimo / contador, con sentido.
 * En ánimo y contador, las entradas sin dato van siempre al final (Daily You las deja con el ánimo vacío al último puesto).
 */
export function ordenarHallazgos<T extends Hallazgo>(lista: T[], orden: Orden, sentido: Sentido): T[] {
  const copia = [...lista];
  if (orden === "relevancia") return copia.sort((a, b) => b.puntaje - a.puntaje || masNuevaPrimero(a, b));
  if (orden === "fecha") return copia.sort(sentido === "asc" ? masViejaPrimero : masNuevaPrimero);
  const clave = (h: Hallazgo) => (orden === "animo" ? h.animo : h.valor);
  const signo = sentido === "asc" ? 1 : -1;
  return copia.sort((a, b) => {
    const x = clave(a);
    const y = clave(b);
    if (x === null || y === null) return x === y ? masNuevaPrimero(a, b) : x === null ? 1 : -1;
    return signo * (x - y) || masNuevaPrimero(a, b);
  });
}

// ── Fechas ──────────────────────────────────────────────────────────────────

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const esFecha = (v: string) => RE_FECHA.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

export function sumarDias(clave: string, dias: number): string {
  const d = new Date(`${clave}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** moodiary `DateRangePreset`. `hoy` = día de hoy de la familia. El rango es inclusivo en ambos extremos. */
export function rangoDePreset(preset: PresetFecha, hoy: string, desde?: string | null, hasta?: string | null): { desde: string | null; hasta: string | null } {
  switch (preset) {
    case "7dias":
      return { desde: sumarDias(hoy, -7), hasta: null };
    case "30dias":
      return { desde: sumarDias(hoy, -30), hasta: null };
    case "anio":
      return { desde: `${hoy.slice(0, 4)}-01-01`, hasta: null };
    case "rango":
      return { desde: desde ?? null, hasta: hasta ?? null };
    default:
      return { desde: null, hasta: null };
  }
}

/** Qué preset describe este rango (para mostrar el chip activo). */
export function presetDe(desde: string | null, hasta: string | null, hoy: string): PresetFecha {
  if (!desde && !hasta) return "todo";
  if (!hasta) {
    for (const p of ["7dias", "30dias", "anio"] as const) if (rangoDePreset(p, hoy).desde === desde) return p;
  }
  return "rango";
}

// ── Categorías ──────────────────────────────────────────────────────────────

/** La categoría y todas sus hijas (moodiary filtra por la elegida; acá entran también las de abajo). */
export function descendientes(id: number, categorias: { id: number; padreId: number | null }[]): number[] {
  const out = new Set<number>([id]);
  for (let cambio = true; cambio; ) {
    cambio = false;
    for (const c of categorias) {
      if (c.padreId !== null && out.has(c.padreId) && !out.has(c.id)) {
        out.add(c.id);
        cambio = true;
      }
    }
  }
  return [...out];
}

// ── Filtro ↔ parámetros del pedido ──────────────────────────────────────────

interface Parametros {
  get(nombre: string): string | null;
}

const entero = (v: string, nombre: string) => {
  if (!/^\d+$/.test(v)) throw new Error(`${nombre} inválido`);
  return Number(v);
};

function listaEnteros(v: string | null, nombre: string, min = 1, max = Number.MAX_SAFE_INTEGER): number[] {
  if (!v) return [];
  const partes = v.split(",").filter(Boolean);
  if (partes.length > MAX_LISTA) throw new Error(`${nombre}: demasiados valores`);
  return [...new Set(partes.map((p) => entero(p, nombre)))].map((n) => {
    if (n < min || n > max) throw new Error(`${nombre} inválido`);
    return n;
  });
}

function triEstado(v: string | null, nombre: string): boolean | null {
  if (v === null || v === "") return null;
  if (v === "si") return true;
  if (v === "no") return false;
  throw new Error(`${nombre} inválido`);
}

/** Valida los parámetros del pedido y arma el filtro completo. Falla con un mensaje claro si algo no es válido. */
export function leerFiltro(p: Parametros): FiltroBusqueda {
  const consulta = (p.get("q") ?? "").replace(/\s+/g, " ").trim();
  if (consulta.length > MAX_CONSULTA) throw new Error(`La búsqueda admite hasta ${MAX_CONSULTA} caracteres`);
  const modo = p.get("etiquetaModo") ?? "alguna";
  if (modo !== "alguna" && modo !== "todas" && modo !== "ninguna") throw new Error("Modo de etiquetas inválido");
  const categoria = p.get("categoria");
  const sinCategoria = p.get("sinCategoria") === "1";
  if (sinCategoria && categoria) throw new Error("Elegí una categoría o «sin categoría», no las dos");
  const desde = p.get("desde") || null;
  const hasta = p.get("hasta") || null;
  for (const f of [desde, hasta]) if (f !== null && !esFecha(f)) throw new Error("Fecha inválida");
  if (desde && hasta && desde > hasta) throw new Error("El rango de fechas está al revés");
  if (desde && desde < FECHA_MINIMA) throw new Error("Fecha inválida");
  const ordenCrudo = p.get("orden");
  if (ordenCrudo !== null && ordenCrudo !== "" && !["relevancia", "fecha", "animo", "contador"].includes(ordenCrudo)) throw new Error("Orden inválido");
  const sentido = p.get("sentido") ?? "desc";
  if (sentido !== "desc" && sentido !== "asc") throw new Error("Sentido inválido");
  const contador = p.get("contador");
  const contadorId = contador ? entero(contador, "Contador") : null;
  let orden: Orden = (ordenCrudo || (consulta ? "relevancia" : "fecha")) as Orden;
  if (orden === "relevancia" && !consulta) orden = "fecha";
  if (orden === "contador" && !contadorId) orden = "fecha";
  const limite = p.get("limite") ? entero(p.get("limite")!, "Límite") : PAGINA;
  if (limite < 1 || limite > MAX_PAGINA) throw new Error("Límite inválido");
  return {
    consulta,
    etiquetas: listaEnteros(p.get("etiquetas"), "Etiquetas"),
    etiquetaModo: modo,
    categoriaId: categoria ? entero(categoria, "Categoría") : null,
    sinCategoria,
    animos: listaEnteros(p.get("animos"), "Ánimos", 1, 5),
    favorita: triEstado(p.get("favorita"), "Favorita"),
    fijada: triEstado(p.get("fijada"), "Fijada"),
    desde,
    hasta,
    anios: listaEnteros(p.get("anios"), "Años", 2000, 2200),
    orden,
    sentido,
    contadorId,
    desplazamiento: p.get("desplazamiento") ? entero(p.get("desplazamiento")!, "Desplazamiento") : 0,
    limite,
  };
}

/** Lo contrario de `leerFiltro`: solo escribe lo que se aparta de lo predeterminado. */
export function aParametros(f: FiltroBusqueda, tipo: string): URLSearchParams {
  const p = new URLSearchParams({ tipo });
  if (f.consulta.trim()) p.set("q", f.consulta.trim());
  if (f.etiquetas.length) p.set("etiquetas", f.etiquetas.join(","));
  if (f.etiquetaModo !== "alguna") p.set("etiquetaModo", f.etiquetaModo);
  if (f.categoriaId !== null) p.set("categoria", String(f.categoriaId));
  if (f.sinCategoria) p.set("sinCategoria", "1");
  if (f.animos.length) p.set("animos", f.animos.join(","));
  if (f.favorita !== null) p.set("favorita", f.favorita ? "si" : "no");
  if (f.fijada !== null) p.set("fijada", f.fijada ? "si" : "no");
  if (f.desde) p.set("desde", f.desde);
  if (f.hasta) p.set("hasta", f.hasta);
  if (f.anios.length) p.set("anios", f.anios.join(","));
  p.set("orden", f.orden);
  if (f.sentido !== "desc") p.set("sentido", f.sentido);
  if (f.contadorId !== null) p.set("contador", String(f.contadorId));
  if (f.desplazamiento) p.set("desplazamiento", String(f.desplazamiento));
  if (f.limite !== PAGINA) p.set("limite", String(f.limite));
  return p;
}

/** Cantidad de filtros activos sin contar el texto ni el orden (para el número del botón «Filtros»). */
export function filtrosActivos(f: FiltroBusqueda): number {
  let n = 0;
  if (f.etiquetas.length || f.etiquetaModo === "ninguna") n++;
  if (f.categoriaId !== null || f.sinCategoria) n++;
  if (f.animos.length) n++;
  if (f.favorita !== null) n++;
  if (f.fijada !== null) n++;
  if (f.desde || f.hasta) n++;
  if (f.anios.length) n++;
  return n;
}

/** ¿Hay algo que buscar? (moodiary exige texto; storypad y Daily You dejan filtrar sin texto: ver B4). */
export const hayBusqueda = (f: FiltroBusqueda) => f.consulta.trim().length > 0 || filtrosActivos(f) > 0;

// ── Historial ───────────────────────────────────────────────────────────────

const limpiarConsulta = (c: string) => c.replace(/\s+/g, " ").trim();

/** moodiary `recordHistory`: la última arriba, sin repetidas, hasta 12. */
export function agregarHistorial(lista: string[], consulta: string): string[] {
  const q = limpiarConsulta(consulta);
  if (!q) return lista;
  return [q, ...lista.filter((e) => e !== q)].slice(0, MAX_HISTORIAL);
}

/** moodiary `removeHistory`. */
export const quitarHistorial = (lista: string[], consulta: string): string[] => lista.filter((e) => e !== consulta);

/** Lo que vuelve del navegador puede estar roto: se queda solo con textos razonables. */
export function leerHistorial(crudo: unknown): string[] {
  if (!Array.isArray(crudo)) return [];
  const out: string[] = [];
  for (const e of crudo) if (typeof e === "string" && limpiarConsulta(e) && e.length <= MAX_CONSULTA && !out.includes(e)) out.push(e);
  return out.slice(0, MAX_HISTORIAL);
}
