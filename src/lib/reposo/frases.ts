// Lógica de frases, mazo barajado, alternancia estricta y selección de fotos (SPEC idle-marco-fotos §4, §6).
import citasBiblicasRaw from "../../data/reposo/citas-biblicas.json" with { type: "json" };
import catecismoRaw from "../../data/reposo/catecismo-pio-x.json" with { type: "json" };

export type CitaBiblica = {
  id: string; // "Ps-22-1-2"
  libro: string;
  capitulo: number;
  desde: number;
  hasta: number;
  la: string; // Vulgata Clementina
  es: string; // Torres Amat
  ref: string; // "Salmo 22, 1-2"
};

export type PreguntaCatecismo = {
  n: number;
  parte: string;
  capitulo: string;
  pregunta: string;
  respuesta: string;
};

export type TipoFrase = "biblia" | "catecismo";

export type ItemFrase =
  | { tipo: "biblia"; datos: CitaBiblica }
  | { tipo: "catecismo"; datos: PreguntaCatecismo };

export const LIMITES_FRASES = {
  maxLatin: 220,
  maxEspBiblia: 300,
  maxPreguntaCatecismo: 140,
  maxRespuestaCatecismo: 360,
  minDuracionMs: 12_000,
  maxDuracionMs: 32_000,
  baseDuracionMs: 8_000,
  msPorCaracter: 55,
  ultimasFotosExcluidas: 12,
} as const;

export function esCitaApta(c: CitaBiblica): boolean {
  return (
    typeof c.la === "string" &&
    typeof c.es === "string" &&
    c.la.trim().length > 0 &&
    c.es.trim().length > 0 &&
    c.la.length <= LIMITES_FRASES.maxLatin &&
    c.es.length <= LIMITES_FRASES.maxEspBiblia
  );
}

export function esPreguntaApta(p: PreguntaCatecismo): boolean {
  return (
    typeof p.pregunta === "string" &&
    typeof p.respuesta === "string" &&
    p.pregunta.trim().length > 0 &&
    p.respuesta.trim().length > 0 &&
    p.pregunta.length <= LIMITES_FRASES.maxPreguntaCatecismo &&
    p.respuesta.length <= LIMITES_FRASES.maxRespuestaCatecismo
  );
}

export const CITAS_APTAS: CitaBiblica[] = (citasBiblicasRaw as CitaBiblica[]).filter(esCitaApta);
export const CATECISMO_APTO: PreguntaCatecismo[] = (catecismoRaw as PreguntaCatecismo[]).filter(esPreguntaApta);

export function calcularDuracionFraseMs(item: ItemFrase): number {
  const chars =
    item.tipo === "biblia"
      ? item.datos.la.length + item.datos.es.length
      : item.datos.pregunta.length + item.datos.respuesta.length;
  const ms = LIMITES_FRASES.baseDuracionMs + LIMITES_FRASES.msPorCaracter * chars;
  return Math.min(LIMITES_FRASES.maxDuracionMs, Math.max(LIMITES_FRASES.minDuracionMs, ms));
}

/** Barajado Fisher-Yates puro. */
export function barajar<T>(array: readonly T[], rng: () => number = Math.random): T[] {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = copia[i];
    copia[i] = copia[j];
    copia[j] = temp;
  }
  return copia;
}

/** Baraja evitando que el primer elemento sea igual al último del ciclo previo (SPEC §4.4). */
export function barajarSinRepetirUltima<T extends { id?: string; n?: number }>(
  items: readonly T[],
  ultimaId?: string | number,
  rng: () => number = Math.random,
): T[] {
  if (items.length <= 1) return [...items];
  const barajado = barajar(items, rng);
  const idDe = (item: T) => item.id ?? item.n;
  if (ultimaId !== undefined && idDe(barajado[0]) === ultimaId) {
    const swapIdx = 1 + Math.floor(rng() * (barajado.length - 1));
    const temp = barajado[0];
    barajado[0] = barajado[swapIdx];
    barajado[swapIdx] = temp;
  }
  return barajado;
}

/**
 * Selecciona una foto al azar del pool, excluyendo las últimas 12 usadas (D39).
 * Si el pool tiene <= 12, evita la inmediata anterior si hay más de 1.
 */
export function elegirFotoSinRepetirUltimas<T extends { id: string }>(
  pool: readonly T[],
  ultimasIds: readonly string[],
  rng: () => number = Math.random,
): { foto: T; ultimasActualizadas: string[] } | null {
  if (!pool || pool.length === 0) return null;
  const limite = LIMITES_FRASES.ultimasFotosExcluidas;
  const recientes = ultimasIds.slice(-limite);
  const recientesSet = new Set(recientes);

  let candidatas = pool.filter((f) => !recientesSet.has(f.id));
  if (candidatas.length === 0) {
    const ultima = recientes[recientes.length - 1];
    candidatas = pool.length > 1 && ultima ? pool.filter((f) => f.id !== ultima) : [...pool];
  }

  const idx = Math.floor(rng() * candidatas.length);
  const seleccionada = candidatas[idx];
  const ultimasActualizadas = [...recientes.filter((id) => id !== seleccionada.id), seleccionada.id].slice(-limite);
  return { foto: seleccionada, ultimasActualizadas };
}

export type EstadoSecuenciaReposo = {
  ultimoTipo: TipoFrase | null;
  ordenBiblia: string[];
  indiceBiblia: number;
  ordenCatecismo: number[];
  indiceCatecismo: number;
  ultimasFotosIds: string[];
};

export function estadoInicialSecuencia(): EstadoSecuenciaReposo {
  return {
    ultimoTipo: null,
    ordenBiblia: [],
    indiceBiblia: 0,
    ordenCatecismo: [],
    indiceCatecismo: 0,
    ultimasFotosIds: [],
  };
}

/**
 * Avanza la secuencia un paso con alternancia estricta Biblia ↔ Catecismo (SPEC §4.4, D38).
 */
export function avanzarSecuencia(
  estado: EstadoSecuenciaReposo,
  citas: readonly CitaBiblica[] = CITAS_APTAS,
  catecismo: readonly PreguntaCatecismo[] = CATECISMO_APTO,
  rng: () => number = Math.random,
): { item: ItemFrase; siguienteEstado: EstadoSecuenciaReposo } {
  const siguienteTipo: TipoFrase = estado.ultimoTipo === "biblia" ? "catecismo" : "biblia";

  if (siguienteTipo === "biblia") {
    let orden = [...estado.ordenBiblia];
    let indice = estado.indiceBiblia;
    if (orden.length === 0 || indice >= orden.length) {
      const ultimaId = orden[orden.length - 1];
      const itemsBarajados = barajarSinRepetirUltima(citas, ultimaId, rng);
      orden = itemsBarajados.map((c) => c.id);
      indice = 0;
    }
    const citaId = orden[indice];
    const cita = citas.find((c) => c.id === citaId) ?? citas[0];
    const siguienteEstado: EstadoSecuenciaReposo = {
      ...estado,
      ultimoTipo: "biblia",
      ordenBiblia: orden,
      indiceBiblia: indice + 1,
    };
    return { item: { tipo: "biblia", datos: cita }, siguienteEstado };
  } else {
    let orden = [...estado.ordenCatecismo];
    let indice = estado.indiceCatecismo;
    if (orden.length === 0 || indice >= orden.length) {
      const ultimaN = orden[orden.length - 1];
      const itemsBarajados = barajarSinRepetirUltima(catecismo, ultimaN, rng);
      orden = itemsBarajados.map((p) => p.n);
      indice = 0;
    }
    const preguntaN = orden[indice];
    const pregunta = catecismo.find((p) => p.n === preguntaN) ?? catecismo[0];
    const siguienteEstado: EstadoSecuenciaReposo = {
      ...estado,
      ultimoTipo: "catecismo",
      ordenCatecismo: orden,
      indiceCatecismo: indice + 1,
    };
    return { item: { tipo: "catecismo", datos: pregunta }, siguienteEstado };
  }
}

export const CLAVE_LOCALSTORAGE_SECUENCIA = "ordo-diei:reposo-secuencia:v1";

export function cargarEstadoSecuencia(): EstadoSecuenciaReposo {
  if (typeof window === "undefined") return estadoInicialSecuencia();
  try {
    const raw = window.localStorage.getItem(CLAVE_LOCALSTORAGE_SECUENCIA);
    if (!raw) return estadoInicialSecuencia();
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.ordenBiblia) &&
      typeof parsed.indiceBiblia === "number" &&
      Array.isArray(parsed.ordenCatecismo) &&
      typeof parsed.indiceCatecismo === "number"
    ) {
      return {
        ultimoTipo: parsed.ultimoTipo === "biblia" || parsed.ultimoTipo === "catecismo" ? parsed.ultimoTipo : null,
        ordenBiblia: parsed.ordenBiblia,
        indiceBiblia: parsed.indiceBiblia,
        ordenCatecismo: parsed.ordenCatecismo,
        indiceCatecismo: parsed.indiceCatecismo,
        ultimasFotosIds: Array.isArray(parsed.ultimasFotosIds) ? parsed.ultimasFotosIds : [],
      };
    }
  } catch {
    // Si falla localStorage, arranca de cero (SPEC §4.4)
  }
  return estadoInicialSecuencia();
}

export function guardarEstadoSecuencia(estado: EstadoSecuenciaReposo): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE_LOCALSTORAGE_SECUENCIA, JSON.stringify(estado));
  } catch {
    // ignorar fallo de almacenamiento
  }
}
