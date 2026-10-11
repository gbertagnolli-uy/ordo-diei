// Simulación de la economía de cartas católicas: dificultad por rareza (vault/ECONOMIA_CARTAS.md §5 y §8)

import {
  CONFIG_RAREZAS,
  SOBRES,
  SOBRE_GLORIA,
  TIPOS_SOBRE,
  TOPE_DIARIO_FRAGMENTOS_PUNTOS,
  precioFragmentoEnPuntos,
  MULTIPLICADOR_TOPE_FRAGMENTOS,
  type ConfigSobre,
  type RarezaCarta,
  type TipoSobre,
} from "./economia.ts";

const RAREZAS: RarezaCarta[] = ["Comun", "Buena", "Perfecta", "Celestial"];

const redondear = (n: number) => Math.round(n * 10) / 10;

export interface DificultadRareza {
  rareza: RarezaCarta;
  fragmentos: number;
  ptsDesbloquear: number;
  diasDesbloquear: number;
  /** Estrellas que hacen falta además de los puntos (Celestial, por sobres de Gloria) */
  estrellasDesbloquear: number;
  /** Días mínimos por el tope diario de compra con puntos, aunque sobren puntos */
  diasMinimosPorTope: number;
  ptsGradoIV: number;
  diasGradoIV: number;
}

export interface ResultadoSimulacion {
  ritmoPtsPorDia: number;
  rarezas: DificultadRareza[];
  /** Valor esperado de cada sobre a precio de compra directa, sobre su costo en puntos (1 = igual) */
  rendimientoSobres: Record<TipoSobre, number>;
}

/** Precio medio por fragmento de un sorteo por bandas restringido a `rarezas` */
function precioMedioBandas(rarezas: readonly RarezaCarta[]): number {
  const pesoTotal = rarezas.reduce((s, r) => s + CONFIG_RAREZAS[r].pesoBanda, 0);
  return rarezas.reduce((s, r) => s + CONFIG_RAREZAS[r].pesoBanda * precioFragmentoEnPuntos(r), 0) / pesoTotal;
}

/** Valor esperado de un sobre a precio de compra directa */
function valorSobre(config: ConfigSobre): number {
  if (config.garantiaRarezas && config.garantiaMinFragmentos) {
    return (
      config.garantiaMinFragmentos * precioMedioBandas(config.garantiaRarezas) +
      (config.fragmentosTotal - config.garantiaMinFragmentos) * precioMedioBandas(RAREZAS)
    );
  }
  return config.fragmentosTotal * precioMedioBandas(config.rarezasPermitidas ?? RAREZAS);
}

export function simularEconomia(ritmoPtsPorDia: number): ResultadoSimulacion {
  const rarezas = RAREZAS.map((rareza): DificultadRareza => {
    const fragmentos = CONFIG_RAREZAS[rareza].fragmentosRequeridos;
    // La Celestial no se compra con puntos: se junta con sobres de Gloria (puntos + estrellas)
    const packsGloria = fragmentos / SOBRE_GLORIA.fragmentosTotal;
    const esCelestial = rareza === "Celestial";
    const ptsDesbloquear = esCelestial
      ? packsGloria * SOBRE_GLORIA.costoPuntos
      : fragmentos * precioFragmentoEnPuntos(rareza);
    const ptsGradoIV = ptsDesbloquear * MULTIPLICADOR_TOPE_FRAGMENTOS;
    return {
      rareza,
      fragmentos,
      ptsDesbloquear,
      diasDesbloquear: redondear(ptsDesbloquear / ritmoPtsPorDia),
      estrellasDesbloquear: esCelestial ? packsGloria * SOBRE_GLORIA.costoEstrellas : 0,
      diasMinimosPorTope: esCelestial ? 1 : Math.ceil(fragmentos / TOPE_DIARIO_FRAGMENTOS_PUNTOS),
      ptsGradoIV,
      diasGradoIV: redondear(ptsGradoIV / ritmoPtsPorDia),
    };
  });

  const rendimientoSobres = Object.fromEntries(
    TIPOS_SOBRE.map((tipo) => [tipo, Math.round((valorSobre(SOBRES[tipo]) / SOBRES[tipo].costoPuntos) * 100) / 100])
  ) as Record<TipoSobre, number>;

  return { ritmoPtsPorDia, rarezas, rendimientoSobres };
}

/**
 * Ejecuta simulación comparativa para 10, 15 y 20 puntos por día
 * (20 ≈ un hijo activo según la base, abril de 2026).
 */
export function ejecutarSimulacionCompleta() {
  const ritmos = [10, 15, 20];
  return ritmos.map((r) => simularEconomia(r));
}
