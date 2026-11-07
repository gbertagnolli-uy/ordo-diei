// Checklists globales en tareas compartidas (lane 265, Plane #22).
// Compartida = la tarea tiene grupoTareaId (una copia por responsable con los mismos ítems).

export type DecisionItem =
  | { ok: true; sinCambios: boolean }
  | { ok: false; status: 409; error: string };

export function puedeCambiarItem(p: { compartida: boolean; completadoActual: boolean; completadoPedido: boolean }): DecisionItem {
  if (p.completadoActual === p.completadoPedido) return { ok: true, sinCambios: true };
  if (p.compartida && p.completadoActual && !p.completadoPedido) {
    return { ok: false, status: 409, error: "En las tareas compartidas un ítem marcado ya no se puede desmarcar" };
  }
  return { ok: true, sinCambios: false };
}
