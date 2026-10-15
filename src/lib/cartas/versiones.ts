// Versiones (grados I a IV) de una carta para el carrusel del detalle (lane 58).
// El navegador nunca recibe la ruta del arte de un grado que el usuario no alcanzó: pide
// /api/cartas/<clave>/version?grado=N y el servidor decide si responde el arte real o una silueta (D19).
import { imagenDeGrado, type CartaConImagenes } from "./fragmentos.ts";
import type { GradoCarta } from "./economia.ts";

export type EstadoVersion = "actual" | "alcanzado" | "bloqueado";

export interface VersionCarta {
  grado: 1 | 2 | 3 | 4;
  estado: EstadoVersion;
  url: string;
}

export const GRADOS_VERSIONES = [1, 2, 3, 4] as const;

/** Mayor grado cuyo arte real puede ver el usuario: la bloqueada ve el I (en blanco y negro) */
export function gradoMaximoReal(gradoVisible: GradoCarta): 1 | 2 | 3 | 4 {
  return Math.max(1, gradoVisible) as 1 | 2 | 3 | 4;
}

/** Hay algo que comparar solo si al menos dos grados tienen arte distinto */
export function tieneVersionesDistintas(carta: CartaConImagenes): boolean {
  return new Set(GRADOS_VERSIONES.map((g) => imagenDeGrado(carta, g))).size > 1;
}

export function listarVersiones(clave: string, gradoVisible: GradoCarta): VersionCarta[] {
  const maximo = gradoMaximoReal(gradoVisible);
  return GRADOS_VERSIONES.map((grado) => {
    const real = grado <= maximo;
    return {
      grado,
      estado: gradoVisible >= 1 && grado === gradoVisible ? "actual" : real && gradoVisible >= 1 ? "alcanzado" : "bloqueado",
      // `e` solo evita servir de la caché una silueta vieja cuando el usuario sube de grado
      url: `/api/cartas/${encodeURIComponent(clave)}/version?grado=${grado}&e=${real ? "real" : "silueta"}`,
    };
  });
}
