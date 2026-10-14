// Portado de vendor/roost/src/types/index.ts, vendor/roost/src/types/showcase.ts y
// vendor/roost/src/db/interfaces/types.ts (msrbuilds/roost@492af47).
// Cambios: ids `number`; solo los campos del esquema de ARQUITECTURA_DETALLADA §3 y PLAN_INTEGRACION_ROOST §4.1;
// los nombres snake_case de Roost se conservan para no tocar los componentes portados; estados y textos en español.

export type VideoPlatform = "youtube" | "vimeo";

/** Roost `Module` → `RecursoCurso`. */
export interface Module {
  id: number;
  materia_id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  display_order: number;
  created_by: number;
}

/** Roost `Recording` → `LeccionCurso`. `video_url` es opcional: hay lecciones de texto o PDF. */
export interface Recording {
  id: number;
  module_id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  video_platform: VideoPlatform | null;
  video_id: string | null;
  thumbnail_url: string | null;
  display_order: number;
  published_by: number;
}

/** Roost `LessonCompletion` → `ProgresoLeccion`: la fila existe = lección completada. */
export interface LessonCompletion {
  user_id: number;
  recording_id: number;
  module_id: number;
  completed_at: string;
}

export interface RecordingWithCompletion extends Recording {
  module?: Pick<Module, "id" | "title"> | null;
  is_completed: boolean;
}

export interface ModuleWithProgress extends Module {
  recording_count: number;
  completed_count: number;
  progress_percentage: number;
}

/** Roost `Event` → `ActividadOffline` (sin virtual/meeting_url/RSVP). */
export interface Event {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  materia_id: number | null;
  created_by: number;
}

/** Roost `EventAttendee` → `ParticipanteActividad` (sin estado de RSVP). */
export interface EventAttendee {
  event_id: number;
  user_id: number;
}

export type ShowcaseStatus = "pendiente" | "aprobada" | "ajustar";

/** Roost `Showcase` → `EvidenciaAprendizaje`. `stars` (1-5) no da monedas. */
export interface Showcase {
  id: number;
  title: string;
  description: string | null;
  author_id: number;
  status: ShowcaseStatus;
  moderation_notes: string | null;
  moderated_by: number | null;
  moderated_at: string | null;
  is_featured: boolean;
  featured_at: string | null;
  stars: number | null;
  dia_lectivo_id: number | null;
}

/** Roost `ShowcaseImage` → `EvidenciaImagen` (`image_url` = `/api/archivos/<uuid>`). */
export interface ShowcaseImage {
  id: number;
  showcase_id: number;
  image_url: string;
  display_order: number;
  caption: string | null;
}

export const SHOWCASE_STATUS_INFO: Record<ShowcaseStatus, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: "Pendiente de revisión", color: "text-warning", bgColor: "bg-warning/10" },
  aprobada: { label: "Aprobada", color: "text-success", bgColor: "bg-success/10" },
  ajustar: { label: "A ajustar", color: "text-destructive", bgColor: "bg-destructive/10" },
};
