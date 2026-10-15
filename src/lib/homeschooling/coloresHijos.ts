// Propio de Ordo (lane 196, C6): un color estable por hijo para la vista «Todos» del plan. Puro.
export const PALETA_HIJOS = ["#2563eb", "#d97706", "#059669", "#db2777", "#7c3aed", "#0891b2", "#b45309", "#4d7c0f"] as const;

/** El color de un hijo según su posición en la lista de hijos (siempre el mismo mientras no cambie el orden) */
export function colorDeHijo(ids: number[], id: number): string {
  const i = ids.indexOf(id);
  return PALETA_HIJOS[(i < 0 ? 0 : i) % PALETA_HIJOS.length];
}
