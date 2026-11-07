// Correcciones al español de la liturgia (lane 258, Plane #10). Clave = hash del bloque (Bloques_Liturgicos);
// valor = el español completo de ese bloque, segmento por segmento, en el mismo orden que el latín.
// Solo se cargan correcciones dadas o aprobadas por Gabriel: los agentes NO traducen (vault/LANE_258).
import type { Bloque, Segmento } from "./tipos.ts";

export const CORRECCIONES_ES: Readonly<Record<string, Segmento[]>> = {
  // "<hash sha-256>": [{ t: "texto", v: "…" }],
};

export function aplicarCorreccion(hash: string, bloque: Bloque, correcciones: Readonly<Record<string, Segmento[]>> = CORRECCIONES_ES): Bloque {
  const es = correcciones[hash];
  if (!es) return bloque;
  return { ...bloque, es, esFalta: false };
}
