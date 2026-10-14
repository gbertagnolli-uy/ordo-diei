import { esPadre } from "../habitos/permisos.ts";

/** Completa una tarea quien la tiene asignada o un padre/madre; un hermano no. */
export function puedeCompletarTarea(
  sesion: { id: number | string; rolFamiliar?: string },
  tarea: { asignadoId: number }
): boolean {
  return Number(sesion.id) === tarea.asignadoId || esPadre(sesion.rolFamiliar);
}
