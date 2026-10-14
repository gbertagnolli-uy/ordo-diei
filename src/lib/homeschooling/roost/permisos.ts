// Portado de vendor/roost/src/services/group.ts:599 (hasPermission) (msrbuilds/roost@492af47).
// Cambios: roles `admin` (Padre/Madre) y `member` (Hijo/Hija); acciones de la materia familiar.
import { esPadre } from "../../habitos/permisos.ts";

export type GroupRole = "admin" | "member";
export type AccionMateria = "ver" | "crear_curso" | "editar_curso" | "borrar_curso" | "editar_materia" | "borrar_materia" | "desmarcar_leccion";

export const rolDeGrupo = (rolFamiliar?: string): GroupRole => (esPadre(rolFamiliar) ? "admin" : "member");

export function hasPermission(userRole: GroupRole | null, action: AccionMateria): boolean {
  if (!userRole) return false;
  if (action === "ver") return true;
  return userRole === "admin";
}
