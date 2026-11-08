// Diario (lane 284): reglas puras de etiquetas, categorías de etiquetas y categorías de entrada. Sin base de datos, con tests.
// Portado de vendor/Daily_You/lib/models/tag.dart, lib/utils/tag_name_sanitizer.dart y lib/providers/tags_provider.dart (Demizo/Daily_You@7cc237d);
// de vendor/storypad/lib/core/databases/models/tag_category_db_model.dart (theachoem/storypad@a76825e) salen la selección única y los emojis sugeridos;
// de vendor/moodiary/packages/feature_base/moodiary_data/lib/src/category_repository.dart (ZhuJHua/moodiary@2c552dd) salen las categorías de entrada.
import { esIconoClave } from "./iconos.ts";
import type { TipoDiario } from "./reglas.ts";

export type TipoEtiqueta = "etiqueta" | "contador";
export type TipoIcono = "emoji" | "icono";

export const MAX_NOMBRE = 40;
export const MAX_VALOR = 20;
export const MAX_ETIQUETAS_ENTRADA = 50;
export const MAX_ETIQUETAS_AMBITO = 300;
export const MAX_GRUPOS_AMBITO = 50;
export const MAX_CATEGORIAS_AMBITO = 200;
/** Niveles de categorías de entrada (moodiary no limita la profundidad; acá sí, para que el selector se pueda usar). */
export const MAX_PROFUNDIDAD_CATEGORIA = 3;

/** Daily You: nombre sin `\ / " ' ` # [ ] { } , :`, con los espacios colapsados y sin espacios en los bordes. */
const PROHIBIDOS = /[\\/"'`#[\]{},:]/g;
export const limpiarNombre = (v: unknown): string => (typeof v === "string" ? v.replace(PROHIBIDOS, "").replace(/\s+/g, " ").trim() : "");

/** Para el campo de nombre mientras se escribe: saca los prohibidos y los espacios repetidos o del principio, pero deja el espacio final. */
export const nombreEscribiendo = (v: string): string => v.replace(PROHIBIDOS, "").replace(/\s+/g, " ").replace(/^ /, "");

const nombreValido = (v: unknown): string => {
  const n = limpiarNombre(v);
  if (!n) throw new Error("Poné un nombre");
  if (n.length > MAX_NOMBRE) throw new Error(`El nombre admite hasta ${MAX_NOMBRE} caracteres`);
  return n;
};

const RE_COLOR = /^#[0-9a-fA-F]{6}$/;
export const esColor = (v: unknown): v is string => typeof v === "string" && RE_COLOR.test(v);
const colorValido = (v: unknown): string | null => {
  if (v == null || v === "") return null;
  if (!esColor(v)) throw new Error("Color inválido");
  return v.toLowerCase();
};

/** Daily You permite un solo carácter como ícono; acá, un solo «carácter visible» (un emoji puede ser varios códigos). */
export function esEmojiUnico(v: unknown): v is string {
  if (typeof v !== "string" || !v.trim() || v.length > 16) return false;
  const piezas = [...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(v.trim())];
  return piezas.length === 1;
}

export function validarIcono(icono: unknown, tipoIcono: unknown): { icono: string | null; tipoIcono: TipoIcono } {
  if (icono == null || icono === "") return { icono: null, tipoIcono: "emoji" };
  if (tipoIcono === "icono") {
    if (!esIconoClave(icono)) throw new Error("Ícono inválido");
    return { icono, tipoIcono: "icono" };
  }
  if (!esEmojiUnico(icono)) throw new Error("El ícono tiene que ser un solo carácter o emoji");
  return { icono: (icono as string).trim(), tipoIcono: "emoji" };
}

// Contador (`tracker`): el valor es un número, como en el diálogo de Daily You (double.tryParse).
const RE_VALOR = /^-?(\d+\.?\d*|\.\d+)$/;
export function validarValor(v: unknown): string {
  const t = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
  if (!t || t.length > MAX_VALOR || !RE_VALOR.test(t) || !Number.isFinite(Number(t))) throw new Error("El valor tiene que ser un número");
  return t;
}

// ── Catálogo ────────────────────────────────────────────────────────────────

export interface Dueno {
  ambito: TipoDiario;
  creadorId: number | null;
}
export interface Actor {
  id: number;
  esPadre: boolean;
}

/** Personal: solo lo ve quien lo creó. Familiar: toda la familia. */
export const puedeVerCatalogo = (x: Dueno, a: Actor) => x.ambito === "familiar" || x.creadorId === a.id;
/** Personal: quien lo creó. Familiar: quien lo creó o un padre (lo sembrado, que no tiene creador, solo un padre). */
export const puedeEditarCatalogo = (x: Dueno, a: Actor) => (x.ambito === "personal" ? x.creadorId === a.id : x.creadorId === a.id || a.esPadre);

export interface EtiquetaValida {
  nombre: string;
  grupoId: number | null;
  icono: string | null;
  tipoIcono: TipoIcono;
  color: string | null;
  tipo: TipoEtiqueta;
}
const idOpcional = (v: unknown, que: string): number | null => {
  if (v == null || v === "") return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v <= 0) throw new Error(`${que} inválido`);
  return v;
};

export function validarEtiqueta(b: Record<string, unknown>): EtiquetaValida {
  if (b.tipo !== "etiqueta" && b.tipo !== "contador") throw new Error("Tipo de etiqueta inválido");
  return {
    nombre: nombreValido(b.nombre),
    grupoId: idOpcional(b.grupoId, "Grupo"),
    ...validarIcono(b.icono, b.tipoIcono),
    color: colorValido(b.color),
    tipo: b.tipo,
  };
}

export interface GrupoValido {
  nombre: string;
  icono: string | null;
  tipoIcono: TipoIcono;
  color: string | null;
  seleccionUnica: boolean;
}
export function validarGrupo(b: Record<string, unknown>): GrupoValido {
  return {
    nombre: nombreValido(b.nombre),
    ...validarIcono(b.icono, b.tipoIcono),
    color: colorValido(b.color),
    seleccionUnica: b.seleccionUnica === true,
  };
}

export interface CategoriaValida {
  nombre: string;
  padreId: number | null;
  color: string | null;
}
export function validarCategoria(b: Record<string, unknown>): CategoriaValida {
  return { nombre: nombreValido(b.nombre), padreId: idOpcional(b.padreId, "Categoría madre"), color: colorValido(b.color) };
}

// ── Etiquetas puestas en una entrada ────────────────────────────────────────

export interface EtiquetaPuesta {
  id: number;
  valor: string | null;
}

/** Forma del cuerpo: `[{ id, valor? }]`, sin repetidas. Si falta (`undefined`) no se tocan las de la entrada. */
export function validarPuestas(raw: unknown): EtiquetaPuesta[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) throw new Error("Etiquetas inválidas");
  if (raw.length > MAX_ETIQUETAS_ENTRADA) throw new Error(`Una entrada admite hasta ${MAX_ETIQUETAS_ENTRADA} etiquetas`);
  const vistas = new Set<number>();
  const salida: EtiquetaPuesta[] = [];
  for (const x of raw) {
    const o = x as { id?: unknown; valor?: unknown } | null;
    if (!o || typeof o.id !== "number" || !Number.isInteger(o.id) || o.id <= 0) throw new Error("Etiquetas inválidas");
    if (vistas.has(o.id)) continue;
    vistas.add(o.id);
    salida.push({ id: o.id, valor: o.valor == null || o.valor === "" ? null : String(o.valor) });
  }
  return salida;
}

export interface EtiquetaDeCatalogo {
  id: number;
  nombre: string;
  tipo: TipoEtiqueta;
  grupoId: number | null;
}
export interface GrupoDeCatalogo {
  id: number;
  nombre: string;
  seleccionUnica: boolean;
}

/**
 * Comprueba las etiquetas puestas contra el catálogo visible: existen, los contadores llevan número y las demás no llevan valor,
 * y de un grupo de selección única (sentimiento, clima) hay una sola (storypad `multiSelect`). Devuelve las puestas normalizadas.
 */
export function validarContraCatalogo(
  puestas: EtiquetaPuesta[],
  etiquetas: Map<number, EtiquetaDeCatalogo>,
  grupos: Map<number, GrupoDeCatalogo>,
): EtiquetaPuesta[] {
  const porGrupo = new Map<number, string>();
  return puestas.map((p) => {
    const e = etiquetas.get(p.id);
    if (!e) throw new Error("Una de las etiquetas no existe");
    if (e.grupoId != null) {
      const g = grupos.get(e.grupoId);
      if (g?.seleccionUnica) {
        const otra = porGrupo.get(e.grupoId);
        if (otra) throw new Error(`En «${g.nombre}» podés elegir una sola (${otra} y ${e.nombre})`);
        porGrupo.set(e.grupoId, e.nombre);
      }
    }
    return { id: p.id, valor: e.tipo === "contador" ? validarValor(p.valor) : null };
  });
}

// ── Secciones (Daily You `buildSections`) ───────────────────────────────────

export interface GrupoOrdenable {
  id: number;
  nombre: string;
}
export interface EtiquetaOrdenable {
  id: number;
  nombre: string;
  grupoId: number | null;
}
export interface Seccion<E, G> {
  grupo: G | null;
  etiquetas: E[];
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Agrupa las etiquetas por categoría. Una etiqueta entra si su nombre o el de su categoría contiene la búsqueda.
 * Primero las sueltas (sin encabezado), después las categorías en el orden recibido; las secciones vacías se omiten.
 * Mantiene el orden de `etiquetas` dentro de cada sección: quien llama decide si es manual o por uso.
 */
export function armarSecciones<E extends EtiquetaOrdenable, G extends GrupoOrdenable>(grupos: G[], etiquetas: E[], busqueda = ""): Seccion<E, G>[] {
  const q = sinAcentos(busqueda.trim());
  const coincide = (e: E) => {
    if (!q) return true;
    if (sinAcentos(e.nombre).includes(q)) return true;
    const g = grupos.find((x) => x.id === e.grupoId);
    return !!g && sinAcentos(g.nombre).includes(q);
  };
  const salida: Seccion<E, G>[] = [];
  const sueltas = etiquetas.filter((e) => e.grupoId == null && coincide(e));
  if (sueltas.length) salida.push({ grupo: null, etiquetas: sueltas });
  for (const g of grupos) {
    const delGrupo = etiquetas.filter((e) => e.grupoId === g.id && coincide(e));
    if (delGrupo.length) salida.push({ grupo: g, etiquetas: delGrupo });
  }
  return salida;
}

export const porOrden = <T extends { orden: number; id: number }>(a: T, b: T) => a.orden - b.orden || a.id - b.id;

// ── Categorías de entrada (moodiary) ────────────────────────────────────────

export interface CategoriaArbol {
  id: number;
  padreId: number | null;
  nombre: string;
}

/** Nivel de una categoría (1 = raíz). Corta si hay un ciclo. */
export function nivelDe(id: number, porId: Map<number, CategoriaArbol>): number {
  let nivel = 1;
  const vistos = new Set<number>([id]);
  for (let p = porId.get(id)?.padreId; p != null; p = porId.get(p)?.padreId) {
    if (vistos.has(p)) return Infinity;
    vistos.add(p);
    nivel++;
  }
  return nivel;
}

/** Cuántos niveles hay debajo de `id` (0 = no tiene hijas). */
export function alturaDe(id: number, categorias: CategoriaArbol[]): number {
  const hijas = categorias.filter((c) => c.padreId === id);
  return hijas.length ? 1 + Math.max(...hijas.map((h) => alturaDe(h.id, categorias))) : 0;
}

/** Valida el padre de una categoría: existe, no es ella ni un descendiente y no pasa del máximo de niveles. */
export function validarPadre(id: number | null, padreId: number | null, categorias: CategoriaArbol[]): void {
  if (padreId == null) return;
  const porId = new Map(categorias.map((c) => [c.id, c]));
  if (!porId.has(padreId)) throw new Error("La categoría madre no existe");
  if (id != null) {
    if (padreId === id) throw new Error("Una categoría no puede ser madre de sí misma");
    for (let p: number | null | undefined = padreId; p != null; p = porId.get(p)?.padreId) {
      if (p === id) throw new Error("Una categoría no puede quedar dentro de una de sus hijas");
    }
  }
  const nueva = nivelDe(padreId, porId) + 1 + (id != null ? alturaDe(id, categorias) : 0);
  if (nueva > MAX_PROFUNDIDAD_CATEGORIA) throw new Error(`Las categorías admiten hasta ${MAX_PROFUNDIDAD_CATEGORIA} niveles`);
}

/** Categorías en orden de árbol (cada madre seguida de sus hijas), con el nivel para sangrar. */
export function aplanarArbol<T extends CategoriaArbol>(categorias: T[]): (T & { nivel: number })[] {
  const salida: (T & { nivel: number })[] = [];
  const ids = new Set(categorias.map((c) => c.id));
  const recorrer = (padre: number | null, nivel: number) => {
    for (const c of categorias.filter((x) => (x.padreId != null && ids.has(x.padreId) ? x.padreId : null) === padre).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))) {
      salida.push({ ...c, nivel });
      recorrer(c.id, nivel + 1);
    }
  };
  recorrer(null, 1);
  return salida;
}

// ── Siembra (lo que Daily You crea la primera vez) ──────────────────────────

export interface EtiquetaSemilla {
  nombre: string;
  icono: string;
  tipoIcono: TipoIcono;
  tipo?: TipoEtiqueta;
  color?: string;
}
export interface GrupoSemilla {
  nombre: string;
  icono: string;
  tipoIcono: TipoIcono;
  seleccionUnica: boolean;
  etiquetas: EtiquetaSemilla[];
}

const emojis = (pares: string): EtiquetaSemilla[] =>
  pares.split("|").map((p) => {
    const [icono, nombre] = p.split(" ");
    return { icono, nombre: nombre.replaceAll("_", " "), tipoIcono: "emoji" as const };
  });

/** Daily You `createDefaultTags`: «Energía» es un contador. «Favorito» no se siembra: lo reemplaza la marca de favorita (lane 285, storypad `starred`). */
export const SEMILLA_SUELTAS: EtiquetaSemilla[] = [{ nombre: "Energía", icono: "battery-charging", tipoIcono: "icono", tipo: "contador", color: "#43a047" }];

export const SEMILLA_GRUPOS: GrupoSemilla[] = [
  {
    // storypad `suggestFeelings` (23) + «Agradecido» de las emociones de Daily You. Una sola por entrada.
    nombre: "Sentimientos",
    icono: "smile",
    tipoIcono: "icono",
    seleccionUnica: true,
    etiquetas: emojis(
      "😄 Contento|🥳 Festejando|🥰 Cariñoso|😂 Muerto_de_risa|😈 Travieso|😌 Aliviado|😊 Feliz|😐 Neutral|🤔 Pensativo|🧐 Curioso|😶 Sin_palabras|😴 Dormido|😔 Desanimado|😢 Triste|😭 Llorando|😰 Ansioso|🤯 Abrumado|😤 Frustrado|😡 Enojado|🤒 Enfermo|🥵 Acalorado|🥶 Con_frío|😋 Satisfecho|🙏 Agradecido",
    ),
  },
  {
    // storypad `suggestActivities` (30) + socializar, pasatiempo y entretenimiento de Daily You.
    nombre: "Actividades",
    icono: "activity",
    tipoIcono: "icono",
    seleccionUnica: false,
    etiquetas: emojis(
      "🏃 Correr|🚴 Bicicleta|🚶 Caminar|🏋️ Gimnasio|🏊 Nadar|🧘 Meditar|⚽ Deporte|💻 Computadora|📖 Leer|📝 Escribir|🎓 Estudiar|🎨 Arte|💼 Trabajo|🍳 Cocinar|🧹 Limpiar|🛒 Compras|☕ Café|🛌 Descansar|🛁 Baño|🌱 Jardín|🎮 Videojuegos|📺 Televisión|🎧 Música|🍽️ Comer|🎤 Cantar|💃 Bailar|📸 Fotos|🚗 Manejar|✈️ Viajar|💇 Peluquería|👥 Socializar|🎲 Pasatiempo|🎭 Entretenimiento",
    ),
  },
  {
    // storypad `suggestWeathers` (8). Una sola por entrada.
    nombre: "Clima",
    icono: "sun",
    tipoIcono: "icono",
    seleccionUnica: true,
    etiquetas: emojis("☀️ Soleado|🌤️ Algo_nublado|☁️ Nublado|🌦️ Llovizna|🌧️ Lluvia|⛈️ Tormenta|🌈 Arcoíris|❄️ Nieve"),
  },
  // storypad `people`: categoría de texto, sin emojis; cada familia agrega las suyas.
  { nombre: "Personas", icono: "users", tipoIcono: "icono", seleccionUnica: false, etiquetas: [] },
];
