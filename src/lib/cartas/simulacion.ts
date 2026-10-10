// Simulación de la economía de cartas católicas (D1, D2, D8)

import {
  CONFIG_RAREZAS,
  SOBRE_MEDITACION,
  SOBRE_REVELACION,
  precioFragmentoEnPuntos,
  MULTIPLICADOR_TOPE_FRAGMENTOS,
} from "./economia.ts";

export interface ResultadoSimulacion {
  ritmoPtsPorDia: number;
  diasPrimeraComunDirecta: number;
  diasPrimeraBuenaDirecta: number;
  diasPrimeraPerfectaDirecta: number;
  diasPrimeraCelestialDirecta: number;
  diasGradoIVComunDirecta: number;
  // Vía sobres
  diasPorSobreMeditacion: number;
  diasPorSobreRevelacion: number;
  fragsEsperadosCelestialPorSobreRevelacion: number;
  sobresEsperadosParaCelestial: number;
  diasEsperadosCelestialPorSobres: number;
}

export function simularEconomia(ritmoPtsPorDia: number): ResultadoSimulacion {
  // 1. Compra directa en tienda
  const comunReq = CONFIG_RAREZAS.Comun.fragmentosRequeridos;
  const buenaReq = CONFIG_RAREZAS.Buena.fragmentosRequeridos;
  const perfectaReq = CONFIG_RAREZAS.Perfecta.fragmentosRequeridos;
  const celestialReq = CONFIG_RAREZAS.Celestial.fragmentosRequeridos;

  const ptsComun = comunReq * precioFragmentoEnPuntos("Comun"); // 10 * 4 = 40 pts
  const ptsBuena = buenaReq * precioFragmentoEnPuntos("Buena"); // 25 * 8 = 200 pts
  const ptsPerfecta = perfectaReq * precioFragmentoEnPuntos("Perfecta"); // 60 * 16 = 960 pts
  const ptsCelestial = celestialReq * precioFragmentoEnPuntos("Celestial"); // 150 * 40 = 6000 pts
  const ptsGradoIVComun =
    comunReq * MULTIPLICADOR_TOPE_FRAGMENTOS * precioFragmentoEnPuntos("Comun"); // 30 * 4 = 120 pts

  // 2. Vía Sobres
  const diasPorSobreMed = SOBRE_MEDITACION.costoPuntos / ritmoPtsPorDia;
  const diasPorSobreRev = SOBRE_REVELACION.costoPuntos / ritmoPtsPorDia;

  // Frags esperados de Celestial por Sobre de Revelación (160 pts):
  // Garantía: 4 frags sorteados entre Perfecta (10) y Celestial (2) -> P(Cel) = 2/12 = 1/6
  // Resto: 4 frags sorteados del pool completo (60+28+10+2 = 100) -> P(Cel) = 2/100 = 0.02
  const fragsGarantiaCel = SOBRE_REVELACION.garantiaMinFragmentos * (2 / 12);
  const fragsRestoCel =
    (SOBRE_REVELACION.fragmentosTotal - SOBRE_REVELACION.garantiaMinFragmentos) * (2 / 100);
  const fragsEsperadosCelestial = fragsGarantiaCel + fragsRestoCel;

  const sobresEsperadosParaCelestial = Math.ceil(celestialReq / fragsEsperadosCelestial);
  const diasEsperadosCelestialPorSobres = Math.round(
    sobresEsperadosParaCelestial * diasPorSobreRev
  );

  return {
    ritmoPtsPorDia,
    diasPrimeraComunDirecta: Math.round((ptsComun / ritmoPtsPorDia) * 10) / 10,
    diasPrimeraBuenaDirecta: Math.round((ptsBuena / ritmoPtsPorDia) * 10) / 10,
    diasPrimeraPerfectaDirecta: Math.round((ptsPerfecta / ritmoPtsPorDia) * 10) / 10,
    diasPrimeraCelestialDirecta: Math.round((ptsCelestial / ritmoPtsPorDia) * 10) / 10,
    diasGradoIVComunDirecta: Math.round((ptsGradoIVComun / ritmoPtsPorDia) * 10) / 10,
    diasPorSobreMeditacion: Math.round(diasPorSobreMed * 10) / 10,
    diasPorSobreRevelacion: Math.round(diasPorSobreRev * 10) / 10,
    fragsEsperadosCelestialPorSobreRevelacion:
      Math.round(fragsEsperadosCelestial * 1000) / 1000,
    sobresEsperadosParaCelestial,
    diasEsperadosCelestialPorSobres,
  };
}

/**
 * Ejecuta simulación comparativa para 10, 15 y 20 puntos por día.
 */
export function ejecutarSimulacionCompleta() {
  const ritmos = [10, 15, 20];
  return ritmos.map((r) => simularEconomia(r));
}
