import type { SeccionResuelta } from "./tipos";

export type ModoMisa = "propio" | "completa";

/**
 * Filtra las secciones de la Santa Misa según el modo seleccionado (SPEC §10.3).
 * - «propio»: incluye únicamente las partes propias del día litúrgico (Introitus, Oratio, Lectio, etc.).
 * - «completa»: incluye todas las partes (Ordinario + Propio intercalado tal como lo entrega DO).
 */
export function filtrarSeccionesMisa(
  secciones: readonly SeccionResuelta[],
  modo: ModoMisa,
): SeccionResuelta[] {
  if (modo === "completa") {
    return [...secciones];
  }
  return secciones.filter((s) => Boolean(s.propio));
}
