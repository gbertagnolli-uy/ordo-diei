// Sorteo de cartas católicas en dos etapas (D2, D3) — Implementación limpia desde cero

import {
  CONFIG_RAREZAS,
  SOBRE_MEDITACION,
  SOBRE_REVELACION,
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

/**
 * Sortea un Sobre de Meditación (D2):
 * - Costo: 40 puntos
 * - 5 fragmentos en 1-3 cartas
 * - Solo bandas Común y Buena
 */
export function sortearSobreMeditacion(
  pool: CartaSorteable[],
  rng: RngFn = Math.random
): ResultadoSobre {
  const rarezasPermitidas = SOBRE_MEDITACION.rarezasPermitidas;
  // Determinar cuántas cartas (1, 2 o 3)
  const numPartes = 1 + Math.floor(rng() * 3);
  const partes = particionarFragmentos(SOBRE_MEDITACION.fragmentosTotal, numPartes, rng);

  const acumuladoPorCarta = new Map<number, { carta: CartaSorteable; cantidad: number }>();

  for (const cantidad of partes) {
    const carta = sortearCarta(pool, rarezasPermitidas, rng);
    const existente = acumuladoPorCarta.get(carta.id);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      acumuladoPorCarta.set(carta.id, { carta, cantidad });
    }
  }

  const items: FragmentoOtorgado[] = Array.from(acumuladoPorCarta.values()).map(
    ({ carta, cantidad }) => ({
      cartaId: carta.id,
      cartaClave: carta.clave,
      rareza: carta.rareza,
      cantidad,
    })
  );

  return {
    nombreSobre: SOBRE_MEDITACION.nombre,
    costoPuntos: SOBRE_MEDITACION.costoPuntos,
    fragmentosTotal: SOBRE_MEDITACION.fragmentosTotal,
    items,
  };
}

/**
 * Sortea un Sobre de Revelación (D2):
 * - Costo: 160 puntos
 * - 8 fragmentos en 1-3 cartas
 * - Garantiza al menos 4 fragmentos de una carta Perfecta o Celestial (sorteo 10:2)
 * - Los 4 fragmentos restantes salen del sorteo completo (todas las bandas)
 */
export function sortearSobreRevelacion(
  pool: CartaSorteable[],
  rng: RngFn = Math.random
): ResultadoSobre {
  const garantiaMin = SOBRE_REVELACION.garantiaMinFragmentos; // 4
  const restoFragmentos = SOBRE_REVELACION.fragmentosTotal - garantiaMin; // 4

  // 1. Carta garantizada Perfecta o Celestial
  const cartaGarantizada = sortearCarta(pool, SOBRE_REVELACION.garantiaRarezas, rng);

  const acumuladoPorCarta = new Map<number, { carta: CartaSorteable; cantidad: number }>();
  acumuladoPorCarta.set(cartaGarantizada.id, {
    carta: cartaGarantizada,
    cantidad: garantiaMin,
  });

  // 2. Fragmentos restantes: repartidos en 1 o 2 tiradas del pool completo
  const numPartesResto = 1 + Math.floor(rng() * 2); // 1 o 2 partes
  const partesResto = particionarFragmentos(restoFragmentos, numPartesResto, rng);

  for (const cantidad of partesResto) {
    const carta = sortearCarta(pool, undefined, rng);
    const existente = acumuladoPorCarta.get(carta.id);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      acumuladoPorCarta.set(carta.id, { carta, cantidad });
    }
  }

  const items: FragmentoOtorgado[] = Array.from(acumuladoPorCarta.values()).map(
    ({ carta, cantidad }) => ({
      cartaId: carta.id,
      cartaClave: carta.clave,
      rareza: carta.rareza,
      cantidad,
    })
  );

  return {
    nombreSobre: SOBRE_REVELACION.nombre,
    costoPuntos: SOBRE_REVELACION.costoPuntos,
    fragmentosTotal: SOBRE_REVELACION.fragmentosTotal,
    items,
  };
}
