// Sorteo de cartas católicas en dos etapas (D2, D3) — Implementación limpia desde cero

import {
  CARTAS_BIENVENIDA,
  CONFIG_RAREZAS,
  SOBRE_MEDITACION,
  SOBRE_REVELACION,
  type ConfigSobre,
  type RarezaCarta,
} from "./economia.ts";

export interface CartaSorteable {
  id: number;
  clave: string;
  rareza: RarezaCarta;
  activa?: boolean;
}

export interface FragmentoOtorgado {
  cartaId: number;
  cartaClave: string;
  rareza: RarezaCarta;
  cantidad: number;
}

export interface ResultadoSobre {
  nombreSobre: string;
  costoPuntos: number;
  fragmentosTotal: number;
  items: FragmentoOtorgado[];
}

export type RngFn = () => number;

/**
 * Elige una banda de rareza según los pesos dados (etapa 1).
 */
export function elegirBanda(
  pesos: Partial<Record<RarezaCarta, number>>,
  rng: RngFn = Math.random
): RarezaCarta {
  const entradas = Object.entries(pesos) as [RarezaCarta, number][];
  const activas = entradas.filter(([, peso]) => peso && peso > 0);
  if (activas.length === 0) {
    throw new Error("No hay bandas de rareza con peso disponible para el sorteo");
  }

  const pesoTotal = activas.reduce((acc, [, peso]) => acc + peso, 0);
  const roll = rng() * pesoTotal;

  let acumulado = 0;
  for (const [rareza, peso] of activas) {
    acumulado += peso;
    if (roll < acumulado) {
      return rareza;
    }
  }

  return activas[activas.length - 1][0];
}

/**
 * Sortea una carta en dos etapas:
 * 1) Elige la banda de rareza por peso fijo renormalizado entre las rarezas disponibles en el pool.
 * 2) Elige uniformemente una carta al azar dentro de esa banda.
 */
export function sortearCarta(
  pool: CartaSorteable[],
  rarezasPermitidas?: readonly RarezaCarta[],
  rng: RngFn = Math.random
): CartaSorteable {
  const activas = pool.filter((c) => c.activa !== false);
  const filtradas = rarezasPermitidas
    ? activas.filter((c) => rarezasPermitidas.includes(c.rareza))
    : activas;

  if (filtradas.length === 0) {
    throw new Error("No hay cartas disponibles en el pool para las rarezas solicitadas");
  }

  // Agrupar cartas por rareza
  const porRareza: Partial<Record<RarezaCarta, CartaSorteable[]>> = {};
  for (const c of filtradas) {
    if (!porRareza[c.rareza]) {
      porRareza[c.rareza] = [];
    }
    porRareza[c.rareza]!.push(c);
  }

  // Construir pesos renormalizados solo para rarezas que efectivamente tienen cartas en el pool
  const pesosDisponibles: Partial<Record<RarezaCarta, number>> = {};
  for (const rareza of Object.keys(porRareza) as RarezaCarta[]) {
    pesosDisponibles[rareza] = CONFIG_RAREZAS[rareza].pesoBanda;
  }

  // Etapa 1: sorteo de la banda
  const bandaElegida = elegirBanda(pesosDisponibles, rng);

  // Etapa 2: sorteo uniforme dentro de la banda elegida
  const cartasEnBanda = porRareza[bandaElegida]!;
  const indice = Math.min(
    cartasEnBanda.length - 1,
    Math.floor(rng() * cartasEnBanda.length)
  );
  return cartasEnBanda[indice];
}

/**
 * Particiona una cantidad total de fragmentos en 1, 2 o 3 partes.
 */
export function particionarFragmentos(
  total: number,
  numPartes: number,
  rng: RngFn = Math.random
): number[] {
  if (numPartes <= 1 || total <= 1) return [total];
  if (numPartes === 2) {
    // Si total = 5 -> [3, 2] o [4, 1]
    const minP1 = 1;
    const maxP1 = total - 1;
    const p1 = minP1 + Math.floor(rng() * (maxP1 - minP1 + 1));
    return [p1, total - p1];
  }
  // numPartes === 3
  if (total < 3) return particionarFragmentos(total, 2, rng);
  const p1 = 1 + Math.floor(rng() * (total - 2));
  const resto = total - p1;
  const p2 = 1 + Math.floor(rng() * (resto - 1));
  const p3 = resto - p2;
  return [p1, p2, p3];
}

/** Junta fragmentos sueltos por carta y los devuelve como ítems del sobre */
function juntarItems(
  acumulado: Map<number, { carta: CartaSorteable; cantidad: number }>
): FragmentoOtorgado[] {
  return Array.from(acumulado.values()).map(({ carta, cantidad }) => ({
    cartaId: carta.id,
    cartaClave: carta.clave,
    rareza: carta.rareza,
    cantidad,
  }));
}

function sumar(
  acumulado: Map<number, { carta: CartaSorteable; cantidad: number }>,
  carta: CartaSorteable,
  cantidad: number
) {
  const existente = acumulado.get(carta.id);
  if (existente) existente.cantidad += cantidad;
  else acumulado.set(carta.id, { carta, cantidad });
}

/**
 * Sortea un sobre cualquiera según su configuración (D2):
 * - Con `garantiaRarezas`: `garantiaMinFragmentos` de una carta de esas rarezas (sorteo por bandas) y el
 *   resto en 1 o 2 tiradas del pool completo.
 * - Sin garantía: los `fragmentosTotal` se parten en `cartasMin`–`cartasMax` cartas de `rarezasPermitidas`.
 */
export function sortearSobre(
  config: ConfigSobre,
  pool: CartaSorteable[],
  rng: RngFn = Math.random
): ResultadoSobre {
  const acumulado = new Map<number, { carta: CartaSorteable; cantidad: number }>();

  if (config.garantiaRarezas && config.garantiaMinFragmentos) {
    sumar(acumulado, sortearCarta(pool, config.garantiaRarezas, rng), config.garantiaMinFragmentos);
    const resto = config.fragmentosTotal - config.garantiaMinFragmentos;
    const partesResto = particionarFragmentos(resto, 1 + Math.floor(rng() * 2), rng);
    for (const cantidad of partesResto) sumar(acumulado, sortearCarta(pool, undefined, rng), cantidad);
  } else {
    const rango = config.cartasMax - config.cartasMin + 1;
    const numPartes = config.cartasMin + Math.floor(rng() * rango);
    const partes = particionarFragmentos(config.fragmentosTotal, numPartes, rng);
    for (const cantidad of partes) sumar(acumulado, sortearCarta(pool, config.rarezasPermitidas, rng), cantidad);
  }

  return {
    nombreSobre: config.nombre,
    costoPuntos: config.costoPuntos,
    fragmentosTotal: config.fragmentosTotal,
    items: juntarItems(acumulado),
  };
}

export function sortearSobreMeditacion(pool: CartaSorteable[], rng: RngFn = Math.random): ResultadoSobre {
  return sortearSobre(SOBRE_MEDITACION, pool, rng);
}

export function sortearSobreRevelacion(pool: CartaSorteable[], rng: RngFn = Math.random): ResultadoSobre {
  return sortearSobre(SOBRE_REVELACION, pool, rng);
}

/**
 * Regalo de bienvenida (D23): `cantidad` cartas Comunes distintas, uniformes al azar.
 * Si hay menos Comunes activas que `cantidad`, devuelve todas.
 */
export function sortearBienvenida<T extends CartaSorteable>(
  pool: T[],
  cantidad: number = CARTAS_BIENVENIDA,
  rng: RngFn = Math.random
): T[] {
  const comunes = pool.filter((c) => c.activa !== false && c.rareza === "Comun");
  // Fisher–Yates parcial: solo se mezclan las primeras `cantidad` posiciones
  for (let i = 0; i < Math.min(cantidad, comunes.length); i++) {
    const j = i + Math.min(comunes.length - 1 - i, Math.floor(rng() * (comunes.length - i)));
    [comunes[i], comunes[j]] = [comunes[j], comunes[i]];
  }
  return comunes.slice(0, cantidad);
}
