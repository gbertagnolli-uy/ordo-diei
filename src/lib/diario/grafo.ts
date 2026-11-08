// Diario (lane 295): grafo de enlaces entre entradas. Reglas puras: sin base, sin red, sin lienzo.
// Portado de `buildLinkGraph`, `buildEgoGraph` y `_graphPreview` de vendor/moodiary/packages/feature_base/moodiary_data/lib/src/diary_repository.dart,
// de `DiaryGraphData` (moodiary_models/diary_graph.dart), de `filterGraph` y `graphNodeLabel` (presentation/graph/graph_scene.dart)
// y de `_TimeFilter` (graph/diary_graph_page.dart) (ZhuJHua/moodiary@2c552dd).

/** Enlaces que trae el grafo general como máximo (decisión G2: cada nodo viaja por la red y se dibuja en Canvas 2D). */
export const MAX_ARISTAS_GRAFO = 5000;
/** `maxNodes` de `buildEgoGraph`. */
export const MAX_NODOS_LOCAL = 300;
export const PROFUNDIDAD_MIN = 1;
export const PROFUNDIDAD_MAX = 3;
/** `_graphPreviewChars`. */
export const LARGO_VISTA_PREVIA = 24;
const LARGO_ROTULO_TITULO = 10;
const LARGO_ROTULO_CUERPO = 5;

/** moodiary `DiaryGraphNode`. `fecha` es "YYYY-MM-DD" y `hora` son minutos desde la medianoche (o null). */
export interface NodoGrafo {
  indice: number;
  id: number;
  titulo: string;
  fecha: string;
  hora: number | null;
  categoriaId: number | null;
  /** Saltos desde el centro (solo en el grafo local). */
  profundidad?: number;
  /** Primeros caracteres del cuerpo, para rotular entradas sin título. */
  vista: string | null;
}

/** moodiary `DiaryGraphData`: `aristas` son pares [origen, destino] de índices de `nodos`, uno detrás de otro. */
export interface DatosGrafo {
  nodos: NodoGrafo[];
  aristas: number[];
  /** Índice del nodo central (grafo local). Siempre 0 cuando existe. */
  centro?: number;
  /** El grafo general llegó al tope de enlaces (`MAX_ARISTAS_GRAFO`) y quedó incompleto. */
  truncado?: boolean;
}

/** Lo que el servidor lee de cada entrada para armar el grafo. */
export interface EntradaGrafo {
  id: number;
  fecha: string;
  hora: number | null;
  titulo: string | null;
  texto: string;
  categoriaId: number | null;
}

export interface EnlaceGrafo {
  origenId: number;
  destinoId: number;
}

export const GRAFO_VACIO: DatosGrafo = { nodos: [], aristas: [] };

export const cantidadAristas = (g: DatosGrafo): number => g.aristas.length / 2;
export const estaVacio = (g: DatosGrafo): boolean => g.nodos.length === 0;

/** Milisegundos de la entrada en UTC (el día más la hora, si la tiene). Solo sirve para ordenar y comparar. */
export function instanteDe(fecha: string, hora: number | null): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return Date.UTC(a, m - 1, d) + (hora ?? 0) * 60_000;
}

/** moodiary `_graphPreview`: el cuerpo en una línea y cortado en 24 caracteres (por caracteres, no por unidades UTF-16). */
export function vistaPrevia(texto: string): string | null {
  const plano = texto.replace(/\s+/g, " ").trim();
  if (!plano) return null;
  const letras = Array.from(plano);
  return letras.length <= LARGO_VISTA_PREVIA ? plano : letras.slice(0, LARGO_VISTA_PREVIA).join("");
}

function nodoDe(indice: number, e: EntradaGrafo, profundidad?: number): NodoGrafo {
  const nodo: NodoGrafo = { indice, id: e.id, titulo: e.titulo ?? "", fecha: e.fecha, hora: e.hora, categoriaId: e.categoriaId, vista: vistaPrevia(e.texto) };
  if (profundidad !== undefined) nodo.profundidad = profundidad;
  return nodo;
}

/** Más nueva primero; a igual instante, por id (el orden de moodiary). */
const masNueva = (a: EntradaGrafo, b: EntradaGrafo): number => instanteDe(b.fecha, b.hora) - instanteDe(a.fecha, a.hora) || a.id - b.id;

/**
 * moodiary `buildLinkGraph`: solo entran las entradas que tienen algún enlace; un enlace cuyo extremo no está disponible (o que apunta a la misma entrada) se descarta.
 * `entradas` son las visibles; `enlaces`, los de la tabla (pueden traer extremos que no están en `entradas`).
 */
export function construirGrafoGeneral(entradas: EntradaGrafo[], enlaces: EnlaceGrafo[]): DatosGrafo {
  const porId = new Map(entradas.map((e) => [e.id, e]));
  const validos = enlaces.filter((l) => l.origenId !== l.destinoId && porId.has(l.origenId) && porId.has(l.destinoId));
  if (!validos.length) return GRAFO_VACIO;
  const extremos = new Set<number>();
  for (const l of validos) {
    extremos.add(l.origenId);
    extremos.add(l.destinoId);
  }
  const ordenadas = [...extremos].map((id) => porId.get(id)!).sort(masNueva);
  const indiceDe = new Map(ordenadas.map((e, i) => [e.id, i]));
  return {
    nodos: ordenadas.map((e, i) => nodoDe(i, e)),
    aristas: validos.flatMap((l) => [indiceDe.get(l.origenId)!, indiceDe.get(l.destinoId)!]),
  };
}

/** Acota los saltos del grafo local a 1–3 (`depth.clamp(1, 3)`); lo que no es un entero vale 1. */
export function profundidadValida(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) ? Math.min(PROFUNDIDAD_MAX, Math.max(PROFUNDIDAD_MIN, n)) : PROFUNDIDAD_MIN;
}

/**
 * Un salto del recorrido de `buildEgoGraph`. `aristas` son los enlaces (en cualquier sentido) que tocan la `frontera`. Anota los enlaces como candidatos y
 * devuelve la frontera siguiente (vacía = terminar): los ids nuevos en orden creciente, hasta llenar `maxNodos`. Modifica `visitados` y `candidatas`.
 * Con `nivel >= profundidad` se anotan los enlaces pero no se avanza (así los enlaces entre nodos del último anillo también cuentan).
 */
export function expandirNivel(
  aristas: EnlaceGrafo[],
  visitados: Map<number, number>,
  candidatas: Map<string, EnlaceGrafo>,
  nivel: number,
  profundidad: number,
  maxNodos: number,
): number[] {
  const descubiertos = new Set<number>();
  for (const a of aristas) {
    if (a.origenId === a.destinoId) continue;
    candidatas.set(`${a.origenId}>${a.destinoId}`, a);
    for (const id of [a.origenId, a.destinoId]) if (!visitados.has(id)) descubiertos.add(id);
  }
  if (nivel >= profundidadValida(profundidad)) return [];
  const presupuesto = maxNodos - visitados.size;
  if (presupuesto <= 0) return [];
  const siguientes = [...descubiertos].sort((a, b) => a - b).slice(0, presupuesto);
  for (const id of siguientes) visitados.set(id, nivel + 1);
  return siguientes;
}

/**
 * Segunda mitad de `buildEgoGraph`: con los saltos recorridos (`profundidades`), los enlaces candidatos y las entradas visibles de esos ids, arma el grafo.
 * El centro queda siempre en el índice 0 (el motor de fuerzas lo fija ahí). Se quitan los nodos que quedaron sin ningún enlace visible, por ejemplo los que
 * solo se alcanzaban por una entrada no disponible.
 */
export function ensamblarGrafoLocal(raizId: number, profundidades: Map<number, number>, candidatas: EnlaceGrafo[], visibles: Map<number, EntradaGrafo>): DatosGrafo {
  if (!visibles.has(raizId)) return GRAFO_VACIO;
  const validos = candidatas.filter((l) => visibles.has(l.origenId) && visibles.has(l.destinoId));
  const conectados = new Set<number>([raizId]);
  for (const l of validos) {
    conectados.add(l.origenId);
    conectados.add(l.destinoId);
  }
  const profundidadDe = (id: number) => profundidades.get(id) ?? 0;
  const ordenadas = [...visibles.values()]
    .filter((e) => conectados.has(e.id))
    .sort((a, b) => profundidadDe(a.id) - profundidadDe(b.id) || masNueva(a, b));
  const indiceDe = new Map(ordenadas.map((e, i) => [e.id, i]));
  return {
    nodos: ordenadas.map((e, i) => nodoDe(i, e, profundidades.get(e.id))),
    aristas: validos.flatMap((l) => [indiceDe.get(l.origenId)!, indiceDe.get(l.destinoId)!]),
    centro: indiceDe.get(raizId),
  };
}

// ── Lo que se ve ─────────────────────────────────────────────────────────────

const cortarLetras = (s: string, max: number): string => {
  const trozos = Array.from(new Intl.Segmenter("es", { granularity: "grapheme" }).segment(s), (x) => x.segment);
  return trozos.length <= max ? s : `${trozos.slice(0, max).join("")}…`;
};

/** moodiary `graphNodeLabel`: el título (hasta 10 caracteres), si no el comienzo del cuerpo (hasta 5) y si no la fecha «MM-DD». No parte un emoji por la mitad. */
export function rotuloDeNodo(n: Pick<NodoGrafo, "titulo" | "vista" | "fecha">): string {
  const titulo = n.titulo.trim();
  if (titulo) return cortarLetras(titulo, LARGO_ROTULO_TITULO);
  const cuerpo = n.vista?.trim() ?? "";
  if (cuerpo) return cortarLetras(cuerpo, LARGO_ROTULO_CUERPO);
  return n.fecha.slice(5);
}

export type PeriodoGrafo = "todo" | "30" | "anio" | "365";
export const PERIODOS_GRAFO: { valor: PeriodoGrafo; titulo: string }[] = [
  { valor: "todo", titulo: "Todo" },
  { valor: "30", titulo: "30 días" },
  { valor: "anio", titulo: "Este año" },
  { valor: "365", titulo: "365 días" },
];
export const esPeriodoGrafo = (v: unknown): v is PeriodoGrafo => v === "todo" || v === "30" || v === "anio" || v === "365";

/** "YYYY-MM-DD" menos `dias` días. */
export function restarDias(clave: string, dias: number): string {
  const [a, m, d] = clave.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d - dias)).toISOString().slice(0, 10);
}

export interface RangoFechas {
  desde: string;
  hasta: string;
}

/** moodiary `_timeRange`: de qué día a hoy (ambos incluidos). `null` = todo. */
export function rangoDePeriodo(periodo: PeriodoGrafo, hoy: string): RangoFechas | null {
  switch (periodo) {
    case "todo":
      return null;
    case "30":
      return { desde: restarDias(hoy, 30), hasta: hoy };
    case "anio":
      return { desde: `${hoy.slice(0, 4)}-01-01`, hasta: hoy };
    case "365":
      return { desde: restarDias(hoy, 365), hasta: hoy };
  }
}

/**
 * moodiary `filterGraph`: deja los enlaces cuyos dos extremos pasan el filtro (categoría exacta y/o rango de días) y los nodos que conservan alguno.
 * Los índices se rehacen. Si no queda nada, el grafo vacío. Sin filtros devuelve el mismo grafo.
 */
export function filtrarGrafo(g: DatosGrafo, filtro: { categoriaId?: number | null; rango?: RangoFechas | null }): DatosGrafo {
  const { categoriaId = null, rango = null } = filtro;
  if (categoriaId === null && rango === null) return g;
  const pasa = (n: NodoGrafo): boolean => {
    if (categoriaId !== null && n.categoriaId !== categoriaId) return false;
    if (rango && (n.fecha < rango.desde || n.fecha > rango.hasta)) return false;
    return true;
  };
  const conservadas: number[] = [];
  const extremos = new Set<number>();
  for (let e = 0; e < cantidadAristas(g); e++) {
    const a = g.aristas[e * 2];
    const b = g.aristas[e * 2 + 1];
    if (!pasa(g.nodos[a]) || !pasa(g.nodos[b])) continue;
    conservadas.push(a, b);
    extremos.add(a);
    extremos.add(b);
  }
  if (!conservadas.length) return GRAFO_VACIO;
  const viejos = [...extremos].sort((x, y) => x - y);
  const nuevoIndice = new Map(viejos.map((v, i) => [v, i]));
  return {
    nodos: viejos.map((v, i) => ({ ...g.nodos[v], indice: i })),
    aristas: conservadas.map((v) => nuevoIndice.get(v)!),
    truncado: g.truncado,
  };
}

/** Para colorear por fecha: 0 = la más antigua, 1 = la más nueva (todas valen 1 si hay una sola fecha), como `_resolveColors` de moodiary. */
export function fraccionesDeFecha(nodos: NodoGrafo[]): number[] {
  if (!nodos.length) return [];
  const instantes = nodos.map((n) => instanteDe(n.fecha, n.hora));
  const min = Math.min(...instantes);
  const max = Math.max(...instantes);
  const rango = max - min;
  return instantes.map((t) => (rango <= 0 ? 1 : (t - min) / rango));
}

export type ModoColorGrafo = "categoria" | "fecha" | "ninguno";
export const MODOS_COLOR_GRAFO: { valor: ModoColorGrafo; titulo: string }[] = [
  { valor: "categoria", titulo: "Categoría" },
  { valor: "fecha", titulo: "Fecha" },
  { valor: "ninguno", titulo: "Sin color" },
];
export const esModoColorGrafo = (v: unknown): v is ModoColorGrafo => v === "categoria" || v === "fecha" || v === "ninguno";

export type DensidadGrafo = "dispersa" | "normal" | "densa";
export const DENSIDADES_GRAFO: { valor: DensidadGrafo; titulo: string }[] = [
  { valor: "dispersa", titulo: "Dispersa" },
  { valor: "normal", titulo: "Normal" },
  { valor: "densa", titulo: "Densa" },
];
export const esDensidadGrafo = (v: unknown): v is DensidadGrafo => v === "dispersa" || v === "normal" || v === "densa";

/** Opciones de la hoja «Vista» que se recuerdan en el navegador. */
export interface OpcionesGrafo {
  periodo: PeriodoGrafo;
  densidad: DensidadGrafo;
  color: ModoColorGrafo;
  etiquetas: boolean;
}

export const OPCIONES_GRAFO: OpcionesGrafo = { periodo: "todo", densidad: "normal", color: "categoria", etiquetas: true };

export const esOpcionesGrafo = (v: unknown): v is OpcionesGrafo => {
  const o = v as OpcionesGrafo | null;
  return !!o && typeof o === "object" && esPeriodoGrafo(o.periodo) && esDensidadGrafo(o.densidad) && esModoColorGrafo(o.color) && typeof o.etiquetas === "boolean";
};
