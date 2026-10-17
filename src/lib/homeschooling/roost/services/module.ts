// Portado de vendor/roost/src/services/module.ts (msrbuilds/roost@492af47).
// Cambios: mismas funciones y firmas; el cuerpo es `fetch` a /api/homeschooling (el servidor usa Prisma).
// `userId` = alumno elegido (solo lo respeta el servidor si quien pide es padre; un hijo siempre ve lo suyo).
// Fuera: markLessonComplete/markLessonIncomplete/getModuleAssets/getUserCompletionsForGroup (H2 y siguientes).
import { api, consulta } from "./http.ts";
import type { Module, ModuleWithProgress, RecordingWithCompletion } from "../tipos.ts";

const BASE = "/api/homeschooling";

export type ModuleInsert = Omit<Module, "id" | "display_order" | "created_by" | "tipo" | "unidad_tipo" | "total_unidades"> &
  Pick<Module, "tipo" | "unidad_tipo"> & { total_unidades?: number };
export type ModuleUpdate = Partial<Omit<Module, "id" | "materia_id" | "tipo" | "created_by">>;

export const getModulesWithProgress = (groupId: number, userId?: number | null) =>
  api<ModuleWithProgress[]>(`${BASE}/materias/${groupId}/cursos${consulta({ alumnoId: userId })}`);

/** Cursos con sus lecciones en una sola consulta (en Roost eran N llamadas, LearnGroupLayout.tsx:79-83) */
export const getModulesWithRecordings = (groupId: number, userId?: number | null) =>
  api<ModuleWithProgress[]>(`${BASE}/materias/${groupId}/cursos${consulta({ alumnoId: userId, incluir: "lecciones" })}`);

export const getModuleById = async (moduleId: number): Promise<Module | null> => {
  try {
    return await api<Module>(`${BASE}/cursos/${moduleId}`);
  } catch {
    return null;
  }
};

export const createModule = (module: ModuleInsert & { materia_id: number }) =>
  api<Module>(`${BASE}/cursos`, {
    method: "POST",
    body: {
      materiaId: module.materia_id,
      titulo: module.title,
      descripcion: module.description,
      portadaUrl: module.thumbnail_url,
      tipo: module.tipo,
      unidadTipo: module.unidad_tipo,
      totalUnidades: module.total_unidades,
      url: module.url,
      libroId: module.libro_id,
      minutosPorUnidad: module.minutos_por_unidad,
      umbralAprobacion: module.umbral_aprobacion,
      navegacionLibre: module.navegacion_libre,
    },
  });

export const updateModule = (moduleId: number, updates: ModuleUpdate) =>
  api<Module>(`${BASE}/cursos/${moduleId}`, {
    method: "PATCH",
    body: {
      titulo: updates.title,
      descripcion: updates.description,
      portadaUrl: updates.thumbnail_url,
      unidadTipo: updates.unidad_tipo,
      totalUnidades: updates.total_unidades,
      url: updates.url,
      libroId: updates.libro_id,
      minutosPorUnidad: updates.minutos_por_unidad,
      umbralAprobacion: updates.umbral_aprobacion,
      navegacionLibre: updates.navegacion_libre,
    },
  });

export const deleteModule = async (moduleId: number): Promise<void> => {
  await api(`${BASE}/cursos/${moduleId}`, { method: "DELETE" });
};

export const reorderModules = async (groupId: number, orderedIds: number[]): Promise<void> => {
  await api(`${BASE}/materias/${groupId}/cursos`, { method: "PUT", body: { ids: orderedIds } });
};

export const getModuleRecordings = (moduleId: number, userId?: number | null) =>
  api<RecordingWithCompletion[]>(`${BASE}/cursos/${moduleId}/lecciones${consulta({ alumnoId: userId })}`);

type Resumen = { id: number; title: string; display_order: number; video_platform: string | null; video_id: string | null };

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- se conserva la firma de Roost (moduleId)
export const getAdjacentRecordings = async (recordingId: number, _moduleId?: number): Promise<{ prev: Resumen | null; next: Resumen | null }> => {
  try {
    const { prev, next } = await api<{ prev: Resumen | null; next: Resumen | null }>(`${BASE}/lecciones/${recordingId}`);
    return { prev, next };
  } catch {
    return { prev: null, next: null };
  }
};

export const getRecordingById = async (recordingId: number): Promise<RecordingWithCompletion | null> => {
  try {
    return (await api<{ recording: RecordingWithCompletion }>(`${BASE}/lecciones/${recordingId}`)).recording;
  } catch {
    return null;
  }
};
