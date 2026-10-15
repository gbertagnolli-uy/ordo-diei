"use client";

// Portado de vendor/roost/src/components/groups/learn/ModuleDetail.tsx (msrbuilds/roost@492af47).
// Cambios: sin pestaña de assets (los PDF van como enlace en la lección), lecciones que ya vienen del layout
// (una sola consulta), fecha y miniaturas con las utilidades de HS0, plan de cada alumno y «Asignar a…», ui/ y tokens.

import { ArrowLeft, CalendarDays, CheckCircle2, Circle, Edit2, FileText, Play, Plus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { ModuleWithProgress } from "@/lib/homeschooling/roost/tipos";
import { hasPermission, type GroupRole } from "@/lib/homeschooling/roost/permisos";
import { miniaturaVideo } from "@/lib/homeschooling/video";

export type PlanVista = { alumnoId: number; nombre: string; inicio: string; fin: string };

export default function CursoDetalle({
  module,
  userRole,
  planes,
  onLessonClick,
  onBack,
  onAddRecording,
  onEditModule,
  onDeleteModule,
  onAsignar,
  onToggleLibre,
}: {
  module: ModuleWithProgress;
  userRole: GroupRole | null;
  planes: PlanVista[];
  onLessonClick: (recordingId: number) => void;
  onBack: () => void;
  onAddRecording: () => void;
  onEditModule: () => void;
  onDeleteModule: () => void;
  onAsignar: () => void;
  onToggleLibre: (libre: boolean) => void;
}) {
  const canManage = hasPermission(userRole, "editar_curso");
  const recordings = module.recordings ?? [];
  const conLecciones = module.tipo === "curso_videos" || module.tipo === "enlaces";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-foreground">{module.title}</h2>
          {module.description && <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>}
          <div className="mt-3 max-w-xs space-y-1">
            <Progress value={module.progress_percentage} />
            <p className="text-xs text-muted-foreground">{module.progress_percentage}%</p>
          </div>
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEditModule} aria-label="Editar curso">
              <Edit2 />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDeleteModule} aria-label="Borrar curso" className="text-destructive">
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {canManage && (
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarDays className="size-4" /> Plan de cada alumno
            </h3>
            <Button size="sm" onClick={onAsignar} disabled={module.total_unidades < 1}>
              Asignar a…
            </Button>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium text-foreground">Navegación libre</span>
              <span className="text-xs text-muted-foreground">El alumno puede adelantar el día siguiente si el anterior está hecho.</span>
            </span>
            <Switch checked={module.navegacion_libre} onCheckedChange={onToggleLibre} />
          </label>
          {planes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {module.total_unidades < 1 ? "Cargá lecciones para poder asignar el curso." : "Nadie tiene este curso asignado todavía."}
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {planes.map((p) => (
                <li key={p.alumnoId} className="flex items-center justify-between py-2">
                  <span className="font-medium text-foreground">{p.nombre}</span>
                  <span className="text-muted-foreground">
                    {p.inicio} → {p.fin}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {conLecciones && (
        <>
          <div className="flex items-center gap-2 border-b pb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-primary">
              <Video className="size-4" /> Lecciones ({recordings.length})
            </span>
            {canManage && (
              <Button size="sm" className="ml-auto" onClick={onAddRecording}>
                <Plus /> Agregar lección
              </Button>
            )}
          </div>

          {recordings.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Video />
                </EmptyMedia>
                <EmptyTitle>Sin lecciones</EmptyTitle>
                <EmptyDescription>Todavía no hay lecciones en este curso.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y rounded-xl border bg-card">
              {recordings.map((recording) => {
                const miniatura =
                  recording.thumbnail_url ??
                  (recording.video_platform && recording.video_id ? miniaturaVideo(recording.video_platform, recording.video_id) : null);
                return (
                  <button
                    key={recording.id}
                    onClick={() => onLessonClick(recording.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                  >
                    {recording.is_completed ? (
                      <CheckCircle2 className="size-5 shrink-0 text-success" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground/60" />
                    )}

                    <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-muted">
                      {miniatura && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={miniatura}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {recording.video_id ? <Play className="size-5 text-foreground/80" fill="currentColor" /> : <FileText className="size-5 text-muted-foreground" />}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-sm font-medium text-foreground">
                        {recording.display_order}. {recording.title}
                      </h4>
                      {recording.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{recording.description}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
