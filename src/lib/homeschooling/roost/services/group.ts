// Portado de vendor/roost/src/services/group.ts (hasPermission L599, createRecording/updateRecording/deleteRecording
// L699-750) (msrbuilds/roost@492af47). Cambios: roles admin (Padre/Madre) y member (Hijo/Hija); fetch a /api/homeschooling;
// más las altas de materia (el «grupo» de Roost).
import { api } from "./http.ts";
import type { Group, RecordingWithCompletion } from "../tipos.ts";

export { hasPermission, rolDeGrupo } from "../permisos.ts";
export type { GroupRole } from "../permisos.ts";

const BASE = "/api/homeschooling";

export type MateriaInsert = {
  name: string;
  description?: string | null;
  cover_url?: string | null;
  icon?: string | null;
  color?: string | null;
  dificultad?: Group["dificultad"];
};

const cuerpoMateria = (m: Partial<MateriaInsert> & { is_active?: boolean }) => ({
  nombre: m.name,
  descripcion: m.description,
  portadaUrl: m.cover_url,
  icono: m.icon,
  color: m.color,
  dificultad: m.dificultad,
  activa: m.is_active,
});

export const getGroups = () => api<(Group & { course_count: number })[]>(`${BASE}/materias`);
export const getGroupById = (id: number) => api<Group>(`${BASE}/materias/${id}`);
export const createGroup = (m: MateriaInsert) => api<Group>(`${BASE}/materias`, { method: "POST", body: cuerpoMateria(m) });
export const updateGroup = (id: number, m: Partial<MateriaInsert> & { is_active?: boolean }) =>
  api<Group>(`${BASE}/materias/${id}`, { method: "PATCH", body: cuerpoMateria(m) });
export const deleteGroup = async (id: number): Promise<void> => {
  await api(`${BASE}/materias/${id}`, { method: "DELETE" });
};

export type RecordingInsert = { module_id: number; title: string; description?: string | null; video_url?: string | null };

export const createRecording = (r: RecordingInsert) =>
  api<RecordingWithCompletion>(`${BASE}/lecciones`, {
    method: "POST",
    body: { recursoId: r.module_id, titulo: r.title, instrucciones: r.description, url: r.video_url },
  });

export const updateRecording = (id: number, u: Partial<Omit<RecordingInsert, "module_id">>) =>
  api<RecordingWithCompletion>(`${BASE}/lecciones/${id}`, {
    method: "PATCH",
    body: { titulo: u.title, instrucciones: u.description, url: u.video_url },
  });

export const deleteRecording = async (id: number): Promise<void> => {
  await api(`${BASE}/lecciones/${id}`, { method: "DELETE" });
};

export const reorderRecordings = async (moduleId: number, orderedIds: number[]): Promise<void> => {
  await api(`${BASE}/cursos/${moduleId}/lecciones`, { method: "PUT", body: { ids: orderedIds } });
};
