// Portado de vendor/roost/src/types/index.ts, vendor/roost/src/types/showcase.ts y
// vendor/roost/src/db/interfaces/types.ts (msrbuilds/roost@492af47).
// Cambios: ids `number`; solo los campos del esquema de ARQUITECTURA_DETALLADA §3 y PLAN_INTEGRACION_ROOST §4.1;
// los nombres snake_case de Roost se conservan para no tocar los componentes portados; estados y textos en español.

import type { DificultadTarea } from "@prisma/client";

export type VideoPlatform = "youtube" | "vimeo";

export type TipoRecurso = "libro" | "curso_videos" | "pdf" | "enlaces" | "libre";
export type UnidadContenido = "pagina" | "capitulo" | "leccion" | "unidad";

/** Roost `Group` → `Materia`. */
export interface Group {
  id: number;
  name: string;
  description: string | null;
  cover_url: string | null;
  icon: string | null;
  color: string | null;
  dificultad: DificultadTarea;
  display_order: number;
  is_active: boolean;
  created_by: number;
}

/** Roost `Module` → `RecursoCurso` (+ campos de pacing). */
export interface Module {
  id: number;
  materia_id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  display_order: number;
  created_by: number;
  tipo: TipoRecurso;
  unidad_tipo: UnidadContenido;
  total_unidades: number;
  url: string | null;
  libro_id: number | null;
  minutos_por_unidad: number;
  umbral_aprobacion: number;
  navegacion_libre: boolean;
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
  /** Solo cuando se pide `incluir=lecciones`: una consulta en vez de N (Roost pedía las grabaciones de a una). */
  recordings?: RecordingWithCompletion[];
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

/** Actividad con lo que muestran las pantallas (materia y participantes) */
export interface EventWithDetails extends Event {
  materia_name: string;
  duracion_min: number;
  participantes: { id: number; nombre: string; fotoUrl: string | null }[];
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

/** Evidencia con lo que muestran las pantallas (autor, materia, imágenes) */
export interface ShowcaseWithDetails extends Showcase {
  author_name: string;
  materia_name: string | null;
  created_at: string;
  images: ShowcaseImage[];
}

export interface ShowcaseStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  featured: number;
  thisMonth: number;
}

export const SHOWCASE_STATUS_INFO: Record<ShowcaseStatus, { label: string; color: string; bgColor: string }> = {
  pendiente: { label: "Pendiente de revisión", color: "text-warning", bgColor: "bg-warning/10" },
  aprobada: { label: "Aprobada", color: "text-success", bgColor: "bg-success/10" },
  ajustar: { label: "A ajustar", color: "text-destructive", bgColor: "bg-destructive/10" },
};
