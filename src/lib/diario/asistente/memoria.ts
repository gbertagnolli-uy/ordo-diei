// Asistente del diario (lane 299): la memoria a largo plazo — hechos duraderos sobre la persona que el asistente guarda y recuerda entre conversaciones. Reglas puras.
// Portado de vendor/moodiary/packages/feature/moodiary_assistant/lib/src/data/{memory_repository,assistant_tools}.dart (`normalizeFact`, `findDuplicate`, `search`,
// `_recallMemory`, `_rememberOneFact`, `_forgetOneFact`) y de packages/feature_base/moodiary_models/lib/src/memory_entry.dart (ZhuJHua/moodiary@2c552dd).
// Diferencias (ver LANE_299 del vault): vive en el navegador y no en una base; tope de 200 hechos y 500 caracteres por hecho; la búsqueda ignora tildes
// (moodiary parte los términos con `[^0-9a-z]+`, que rompe el español).

import { PREFIJO_FALLO, RECUERDO_MAXIMO, RECUERDO_POR_DEFECTO, idsDe, type HerramientaDeMemoria } from "./herramientas.ts";
import { ejecutarLote } from "./formato.ts";

export const CATEGORIAS_HECHO = ["preference", "theme", "goal", "fact"] as const;
export type CategoriaHecho = (typeof CATEGORIAS_HECHO)[number];
export const FUENTES_HECHO = ["user_said", "user_asked"] as const;
export type FuenteHecho = (typeof FUENTES_HECHO)[number];

export const MAX_HECHOS = 200;
export const MAX_TEXTO_HECHO = 500;
/** moodiary `_kSearchThreshold`: la lista solo ofrece buscar cuando hay más de esto. */
export const UMBRAL_BUSQUEDA = 6;

export interface Hecho {
  id: string;
  categoria: CategoriaHecho;
  texto: string;
  /** Milisegundos desde 1970. */
  creadoEn: number;
  actualizadoEn: number;
  fuente: FuenteHecho | null;
}

type Objeto = Record<string, unknown>;

const esCategoria = (v: unknown): v is CategoriaHecho => typeof v === "string" && (CATEGORIAS_HECHO as readonly string[]).includes(v);
const esFuente = (v: unknown): v is FuenteHecho => typeof v === "string" && (FUENTES_HECHO as readonly string[]).includes(v);

const categoriaDe = (v: unknown): CategoriaHecho => {
  const t = typeof v === "string" ? v.trim() : "";
  return esCategoria(t) ? t : "fact";
};
const fuenteDe = (v: unknown): FuenteHecho => {
  const t = typeof v === "string" ? v.trim() : "";
  return esFuente(t) ? t : "user_said";
};

export const ROTULO_CATEGORIA: Record<CategoriaHecho, string> = { preference: "Preferencia", theme: "Tema", goal: "Meta", fact: "Dato" };
export const ROTULO_FUENTE: Record<FuenteHecho, string> = { user_said: "lo dijiste vos", user_asked: "me lo pediste" };

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const PUNTUACION = /[.,;:!?()[\]\-、。，；：！？…·「」『』（）【】“”‘’"']/gu;

/** moodiary `normalizeFact`: minúsculas, sin puntuación, espacios simples (y acá, sin tildes) — para reconocer un hecho repetido. */
export function normalizarHecho(texto: string): string {
  return sinTildes(texto.toLowerCase()).replace(PUNTUACION, "").replace(/\s+/g, " ").trim();
}

/** moodiary `_terms`: palabras de más de una letra, y cada carácter CJK como un término. */
export function terminosDe(consulta: string): string[] {
  const bajada = sinTildes(consulta.toLowerCase());
  const salida = new Set<string>();
  for (const w of bajada.split(/[^\p{L}\p{N}]+/u)) if (w.length > 1) salida.add(w);
  for (const ch of bajada) if ((ch.codePointAt(0) ?? 0) > 0x2e80) salida.add(ch);
  return [...salida];
}

const masReciente = (a: Hecho, b: Hecho) => b.actualizadoEn - a.actualizadoEn;

/** moodiary `getRecent` / `getAll`: lo último que se tocó, primero. */
export const ordenarHechos = (hechos: Hecho[]): Hecho[] => [...hechos].sort(masReciente);
export const recientes = (hechos: Hecho[], limite: number): Hecho[] => ordenarHechos(hechos).slice(0, limite);

/** moodiary `MemoryRepository.search`: por cantidad de términos que aparecen, y a igualdad, el más reciente. */
export function buscarHechos(hechos: Hecho[], consulta: string, limite = RECUERDO_POR_DEFECTO): Hecho[] {
  const terminos = terminosDe(consulta);
  if (!terminos.length) return recientes(hechos, limite);
  const puntuados: { aciertos: number; hecho: Hecho }[] = [];
  for (const hecho of hechos) {
    const pajar = sinTildes(`${hecho.categoria} ${hecho.texto}`.toLowerCase());
    const aciertos = terminos.filter((t) => pajar.includes(t)).length;
    if (aciertos > 0) puntuados.push({ aciertos, hecho });
  }
  puntuados.sort((a, b) => b.aciertos - a.aciertos || masReciente(a.hecho, b.hecho));
  return puntuados.slice(0, limite).map((p) => p.hecho);
}

/** moodiary `findDuplicate`: el mismo hecho (mismo tipo y mismo texto normalizado). */
export function hechoRepetido(hechos: Hecho[], categoria: CategoriaHecho, texto: string): Hecho | null {
  const clave = normalizarHecho(texto);
  if (!clave) return null;
  return hechos.find((h) => h.categoria === categoria && normalizarHecho(h.texto) === clave) ?? null;
}

/** Filtro de la pantalla de memoria (moodiary `_matched`): el texto contiene lo escrito, sin distinguir tildes ni mayúsculas. */
export function filtrarHechos(hechos: Hecho[], consulta: string): Hecho[] {
  const q = sinTildes(consulta.trim().toLowerCase());
  if (!q) return hechos;
  return hechos.filter((h) => sinTildes(h.texto.toLowerCase()).includes(q));
}

// ── Las tres herramientas ───────────────────────────────────────────────────

export interface ContextoMemoria {
  ahora: number;
  nuevoId: () => string;
}

export interface ResultadoMemoria {
  /** El texto que ve el modelo. */
  resultado: string;
  /** Los hechos después de la operación (la lista de entrada no se modifica). */
  hechos: Hecho[];
}

function recordar(entrada: Objeto, hechos: Hecho[]): ResultadoMemoria {
  const consulta = typeof entrada.query === "string" ? entrada.query.trim() : "";
  const pedido = typeof entrada.limit === "number" && Number.isFinite(entrada.limit) ? Math.trunc(entrada.limit) : RECUERDO_POR_DEFECTO;
  const limite = Math.min(RECUERDO_MAXIMO, Math.max(1, pedido));
  const encontrados = consulta ? buscarHechos(hechos, consulta, limite) : recientes(hechos, limite);
  if (!encontrados.length) {
    return {
      resultado: hechos.length === 0 ? "No saved facts yet. Nothing was remembered about this user." : `0 matches among ${hechos.length} saved facts. Say plainly that you do not have it rather than guessing.`,
      hechos,
    };
  }
  return { resultado: encontrados.map((h) => `id=${h.id} kind=${h.categoria} text=${h.texto}`).join("\n"), hechos };
}

async function guardar(entrada: Objeto, hechos: Hecho[], ctx: ContextoMemoria): Promise<ResultadoMemoria> {
  let actual = hechos;
  const resultado = await ejecutarLote(entrada, async (item) => {
    const texto = (typeof item.text === "string" ? item.text : "").trim();
    if (!texto) return `${PREFIJO_FALLO} the fact cannot be empty.`;
    if (texto.length > MAX_TEXTO_HECHO) return `${PREFIJO_FALLO} the fact is too long (max ${MAX_TEXTO_HECHO} characters). State it in one plain sentence.`;
    const categoria = categoriaDe(item.category);
    const id = (typeof item.id === "string" ? item.id : "").trim();
    if (id) {
      const actualDelId = actual.find((h) => h.id === id);
      if (!actualDelId) return `${PREFIJO_FALLO} no memory with id=${id}.`;
      actual = actual.map((h) => (h.id === id ? { ...h, texto, categoria, actualizadoEn: ctx.ahora } : h));
      return `Revised the memory (id=${id}): ${texto}.`;
    }
    const repetido = hechoRepetido(actual, categoria, texto);
    if (repetido) {
      actual = actual.map((h) => (h.id === repetido.id ? { ...h, actualizadoEn: ctx.ahora } : h));
      return `Already saved (${categoria}): ${repetido.texto} (id=${repetido.id}).`;
    }
    if (actual.length >= MAX_HECHOS) return `${PREFIJO_FALLO} the memory is full (${MAX_HECHOS} facts). Revise an existing fact by id, or tell the user it is full.`;
    const fuente = fuenteDe(item.source);
    const nuevo: Hecho = { id: ctx.nuevoId(), categoria, texto, creadoEn: ctx.ahora, actualizadoEn: ctx.ahora, fuente };
    actual = [...actual, nuevo];
    return `Remembered (${categoria}): ${texto} (id=${nuevo.id}).`;
  });
  return { resultado, hechos: actual };
}

async function olvidar(entrada: Objeto, hechos: Hecho[]): Promise<ResultadoMemoria> {
  let actual = hechos;
  // `forgetFact` recibe `ids`; `ejecutarLote` los reparte uno por elemento
  const resultado = await ejecutarLote({ ids: idsDe(entrada) }, async (item) => {
    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!id) return `${PREFIJO_FALLO} no memory id given.`;
    if (!actual.some((h) => h.id === id)) return `${PREFIJO_FALLO} no memory with id=${id}.`;
    actual = actual.filter((h) => h.id !== id);
    return `Deleted the memory (id=${id}).`;
  });
  return { resultado, hechos: actual };
}

/** Ejecuta una herramienta de memoria sobre los hechos que ya hay. No toca el almacenamiento: devuelve los hechos nuevos para que quien llama los guarde. */
export async function ejecutarMemoria(nombre: HerramientaDeMemoria, args: Objeto, hechos: Hecho[], ctx: ContextoMemoria): Promise<ResultadoMemoria> {
  switch (nombre) {
    case "recallMemory":
      return recordar(args, hechos);
    case "rememberFact":
      return guardar(args, hechos, ctx);
    case "forgetFact":
      return olvidar(args, hechos);
  }
}

// ── Pantalla de memoria ─────────────────────────────────────────────────────

/** moodiary `_edit`: cambia el texto y el tipo, y cuenta como tocado ahora. */
export function editarHecho(hechos: Hecho[], id: string, cambios: { texto: string; categoria: CategoriaHecho }, ahora: number): Hecho[] {
  const texto = cambios.texto.trim().slice(0, MAX_TEXTO_HECHO);
  if (!texto) return hechos;
  return hechos.map((h) => (h.id === id ? { ...h, texto, categoria: esCategoria(cambios.categoria) ? cambios.categoria : h.categoria, actualizadoEn: ahora } : h));
}

export const quitarHecho = (hechos: Hecho[], id: string): Hecho[] => hechos.filter((h) => h.id !== id);

// ── Lectura segura del almacén ──────────────────────────────────────────────

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function hechoValido(v: unknown): Hecho | null {
  if (typeof v !== "object" || v === null) return null;
  const h = v as Record<string, unknown>;
  const id = typeof h.id === "string" ? h.id.slice(0, 60) : "";
  const texto = typeof h.texto === "string" ? h.texto.trim().slice(0, MAX_TEXTO_HECHO) : "";
  if (!id || !texto) return null;
  return { id, categoria: esCategoria(h.categoria) ? h.categoria : "fact", texto, creadoEn: num(h.creadoEn), actualizadoEn: num(h.actualizadoEn), fuente: esFuente(h.fuente) ? h.fuente : null };
}

export function hechosValidos(v: unknown): Hecho[] {
  if (!Array.isArray(v)) return [];
  const vistos = new Set<string>();
  const salida: Hecho[] = [];
  for (const crudo of v) {
    const h = hechoValido(crudo);
    if (!h || vistos.has(h.id)) continue;
    vistos.add(h.id);
    salida.push(h);
  }
  return ordenarHechos(salida).slice(0, MAX_HECHOS);
}
