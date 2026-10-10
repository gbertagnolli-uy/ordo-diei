// Lógica de fragmentos, grados de veneración e imágenes por grado (D4, D14, D15, D19)

import {
  CONFIG_RAREZAS,
  MULTIPLICADOR_TOPE_FRAGMENTOS,
  type GradoCarta,
  type RarezaCarta,
} from "./economia.ts";

export interface ResultadoAplicarFragmentos {
  nuevo: number;
  desbloquea: boolean;
  gradoAntes: GradoCarta;
  gradoDespues: GradoCarta;
  excedente: number;
  incienso: number;
}

export interface CartaConImagenes {
  imagenUrl: string;
  imagenGrado2Url?: string | null;
  imagenGrado3Url?: string | null;
  imagenGrado4Url?: string | null;
}

/**
 * Calcula el Grado de Veneración (0 a 4) según los fragmentos y los requeridos (D14):
 * - 0: Bloqueada (< 100 %)
 * - 1: Grado I · Desbloqueada (100 % a < 150 %)
 * - 2: Grado II · Venerada (150 % a < 200 %)
 * - 3: Grado III · Iluminada (200 % a < 300 %)
 * - 4: Grado IV · Gloriosa (>= 300 %, tope)
 */
export function gradoDe(fragmentos: number, requeridos: number): GradoCarta {
  if (requeridos <= 0) return 0;
  const p = fragmentos / requeridos;

  if (p < 1.0) return 0;
  if (p < 1.5) return 1;
  if (p < 2.0) return 2;
  if (p < 3.0) return 3;
  return 4;
}

/**
 * Suma fragmentos a una carta con tope (requeridos × 3).
 * Si excede el tope, el sobrante se convierte en Granos de Incienso según el valor de la rareza (D4, D15).
 */
export function aplicarFragmentos(
  actual: number,
  requeridos: number,
  rareza: RarezaCarta,
  cantidad: number
): ResultadoAplicarFragmentos {
  if (cantidad < 0) {
    throw new Error("La cantidad de fragmentos a aplicar no puede ser negativa");
  }

  const tope = requeridos * MULTIPLICADOR_TOPE_FRAGMENTOS;
  const total = actual + cantidad;
  const nuevo = Math.min(tope, total);
  const excedente = Math.max(0, total - tope);
  const valor = CONFIG_RAREZAS[rareza].valorFragmento;
  const incienso = excedente * valor;

  const gradoAntes = gradoDe(actual, requeridos);
  const gradoDespues = gradoDe(nuevo, requeridos);
  const desbloquea = actual < requeridos && nuevo >= requeridos;

  return {
    nuevo,
    desbloquea,
    gradoAntes,
    gradoDespues,
    excedente,
    incienso,
  };
}

/**
 * Devuelve la URL de la imagen del grado especificado (D19).
 * Si falta la imagen de ese grado, busca en cascada la del grado anterior más alto cargado.
 * Para cartas bloqueadas (grado 0), devuelve la imagen del grado I.
 */
export function imagenDeGrado(carta: CartaConImagenes, grado: GradoCarta): string {
  if (grado <= 1) {
    return carta.imagenUrl;
  }
  if (grado === 2) {
    return carta.imagenGrado2Url || carta.imagenUrl;
  }
  if (grado === 3) {
    return carta.imagenGrado3Url || carta.imagenGrado2Url || carta.imagenUrl;
  }
  // grado === 4
  return (
    carta.imagenGrado4Url ||
    carta.imagenGrado3Url ||
    carta.imagenGrado2Url ||
    carta.imagenUrl
  );
}
