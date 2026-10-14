// Portado de vendor/roost/src/db/adapters/mongodb/index.ts:472-515 (mapModule, mapRecording, mapLessonCompletion)
// (msrbuilds/roost@492af47). Cambios: filas de Prisma (camelCase, ids numéricos) → DTO con los nombres de Roost.
import type { DiaLectivo, EvidenciaAprendizaje, EvidenciaImagen, LeccionCurso, Materia, RecursoCurso } from "@prisma/client";
import type { Group, Module, ModuleWithProgress, Recording, RecordingWithCompletion, ShowcaseWithDetails } from "./tipos.ts";

export function mapGroup(m: Materia): Group {
  return {
    id: m.id,
    name: m.nombre,
    description: m.descripcion,
    cover_url: m.portadaUrl,
    icon: m.icono,
    color: m.color,
    dificultad: m.dificultad,
    display_order: m.orden,
    is_active: m.activa,
    created_by: m.creadorId,
  };
}

export function mapModule(r: RecursoCurso): Module {
  return {
    id: r.id,
    materia_id: r.materiaId,
    title: r.titulo,
    description: r.descripcion,
    thumbnail_url: r.portadaUrl,
    display_order: r.orden,
    created_by: r.creadorId,
    tipo: r.tipo,
    unidad_tipo: r.unidadTipo,
    total_unidades: r.totalUnidades,
    url: r.url,
    libro_id: r.libroId,
    minutos_por_unidad: r.minutosPorUnidad,
    umbral_aprobacion: r.umbralAprobacion,
    navegacion_libre: r.navegacionLibre,
  };
}

export function mapRecording(l: LeccionCurso, completada = false): RecordingWithCompletion {
  const rec: Recording = {
    id: l.id,
    module_id: l.recursoId,
    title: l.titulo,
    description: l.instrucciones,
    video_url: l.url,
    video_platform: l.videoPlataforma,
    video_id: l.videoId,
    thumbnail_url: l.miniaturaUrl,
    display_order: l.orden,
    published_by: l.creadorId,
  };
  return { ...rec, is_completed: completada };
}

/** Unidades cubiertas por días `hecha`/`omitida` de un plan (el avance de H1b; H2 suma `ProgresoLeccion`). */
export function unidadesCubiertas(dias: Pick<DiaLectivo, "estado" | "unidadDesde" | "unidadHasta">[]): Set<number> {
  const set = new Set<number>();
  for (const d of dias) {
    if (d.estado !== "hecha" && d.estado !== "omitida") continue;
    for (let u = d.unidadDesde; u <= d.unidadHasta; u++) set.add(u);
  }
  return set;
}

export function mapModuleWithProgress(
  r: RecursoCurso,
  lecciones: LeccionCurso[],
  cubiertas: Set<number>,
  incluirLecciones: boolean
): ModuleWithProgress {
  const total = Math.max(r.totalUnidades, 0);
  const hechas = Math.min([...cubiertas].filter((u) => u <= total).length, total);
  const base: ModuleWithProgress = {
    ...mapModule(r),
    recording_count: lecciones.length,
    completed_count: hechas,
    progress_percentage: total > 0 ? Math.round((hechas / total) * 100) : 0,
  };
  if (incluirLecciones) base.recordings = lecciones.map((l) => mapRecording(l, cubiertas.has(l.orden)));
  return base;
}

/** Portado de `mapShowcase` (vendor/roost/src/db/adapters/mongodb/index.ts:363): evidencia → DTO con los nombres de Roost */
export function mapShowcase(
  e: EvidenciaAprendizaje & { imagenes: EvidenciaImagen[]; alumno: { nombre: string }; diaLectivo?: { plan: { recurso: { materia: { nombre: string } } } } | null }
): ShowcaseWithDetails {
  return {
    id: e.id,
    title: e.titulo ?? "",
    description: e.nota,
    author_id: e.alumnoId,
    status: e.estado,
    moderation_notes: e.comentarioPadre,
    moderated_by: e.revisadaPorId,
    moderated_at: e.revisadaEn?.toISOString() ?? null,
    is_featured: e.destacada,
    featured_at: e.destacadaEn?.toISOString() ?? null,
    stars: e.estrellas,
    dia_lectivo_id: e.diaLectivoId,
    author_name: e.alumno.nombre,
    materia_name: e.diaLectivo?.plan.recurso.materia.nombre ?? null,
    created_at: e.createdAt.toISOString(),
    images: [...e.imagenes]
      .sort((a, b) => a.orden - b.orden || a.id - b.id)
      .map((i) => ({ id: i.id, showcase_id: i.evidenciaId, image_url: i.archivoUrl, display_order: i.orden, caption: i.pie })),
  };
}
