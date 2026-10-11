// Simulación de la economía de cartas católicas: dificultad por rareza (vault/ECONOMIA_CARTAS.md §5)

import {
  CONFIG_RAREZAS,
  SOBRE_MEDITACION,
  SOBRE_REVELACION,
  TOPE_DIARIO_FRAGMENTOS_PUNTOS,
  precioFragmentoEnPuntos,
  MULTIPLICADOR_TOPE_FRAGMENTOS,
  type RarezaCarta,
} from "./economia.ts";

const RAREZAS: RarezaCarta[] = ["Comun", "Buena", "Perfecta", "Celestial"];

const redondear = (n: number) => Math.round(n * 10) / 10;

export interface DificultadRareza {
  rareza: RarezaCarta;
  fragmentos: number;
  ptsDesbloquear: number;
  diasDesbloquear: number;
  /** Días mínimos por el tope diario de compra con puntos, aunque sobren puntos */
  diasMinimosPorTope: number;
  ptsGradoIV: number;
  diasGradoIV: number;
}

export interface ResultadoSimulacion {
  ritmoPtsPorDia: number;
  rarezas: DificultadRareza[];
  /** Valor esperado de cada sobre a precio de compra directa, sobre su costo (1 = igual) */
  rendimientoSobreMeditacion: number;
  rendimientoSobreRevelacion: number;
}

/** Precio medio por fragmento de un sorteo por bandas restringido a `rarezas` */
function precioMedioBandas(rarezas: readonly RarezaCarta[]): number {
  const pesoTotal = rarezas.reduce((s, r) => s + CONFIG_RAREZAS[r].pesoBanda, 0);
  return rarezas.reduce((s, r) => s + CONFIG_RAREZAS[r].pesoBanda * precioFragmentoEnPuntos(r), 0) / pesoTotal;
}

export function simularEconomia(ritmoPtsPorDia: number): ResultadoSimulacion {
  const rarezas = RAREZAS.map((rareza): DificultadRareza => {
    const fragmentos = CONFIG_RAREZAS[rareza].fragmentosRequeridos;
    const ptsDesbloquear = fragmentos * precioFragmentoEnPuntos(rareza);
    const ptsGradoIV = ptsDesbloquear * MULTIPLICADOR_TOPE_FRAGMENTOS;
    return {
      rareza,
      fragmentos,
      ptsDesbloquear,
      diasDesbloquear: redondear(ptsDesbloquear / ritmoPtsPorDia),
      diasMinimosPorTope: Math.ceil(fragmentos / TOPE_DIARIO_FRAGMENTOS_PUNTOS),
      ptsGradoIV,
      diasGradoIV: redondear(ptsGradoIV / ritmoPtsPorDia),
    };
  });

  const valorMeditacion = SOBRE_MEDITACION.fragmentosTotal * precioMedioBandas(SOBRE_MEDITACION.rarezasPermitidas);
  const valorRevelacion =
    SOBRE_REVELACION.garantiaMinFragmentos * precioMedioBandas(SOBRE_REVELACION.garantiaRarezas) +
    (SOBRE_REVELACION.fragmentosTotal - SOBRE_REVELACION.garantiaMinFragmentos) * precioMedioBandas(RAREZAS);

  return {
    ritmoPtsPorDia,
    rarezas,
    rendimientoSobreMeditacion: Math.round((valorMeditacion / SOBRE_MEDITACION.costoPuntos) * 100) / 100,
    rendimientoSobreRevelacion: Math.round((valorRevelacion / SOBRE_REVELACION.costoPuntos) * 100) / 100,
  };
}

/**
 * Ejecuta simulación comparativa para 10, 15 y 20 puntos por día
 * (20 ≈ un hijo activo según la base, abril de 2026).
 */
export function ejecutarSimulacionCompleta() {
  const ritmos = [10, 15, 20];
  return ritmos.map((r) => simularEconomia(r));
}
