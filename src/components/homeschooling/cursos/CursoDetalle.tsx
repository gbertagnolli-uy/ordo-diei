"use client";

// Portado de vendor/roost/src/components/groups/learn/ModuleDetail.tsx (msrbuilds/roost@492af47).
// Cambios: sin pestaña de assets (los PDF van como enlace en la lección), lecciones que ya vienen del layout
// (una sola consulta), fecha y miniaturas con las utilidades de HS0, plan de cada alumno y «Asignar a…», ui/ y tokens.

import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CalendarDays, CheckCircle2, Copy, Download, EllipsisVertical, Circle, Edit2, FileText, ListPlus, Paperclip, Play, Plus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ListaMaterial from "@/components/homeschooling/material/ListaMaterial";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { ModuleWithProgress } from "@/lib/homeschooling/roost/tipos";
import { hasPermission, type GroupRole } from "@/lib/homeschooling/roost/permisos";
import { esArchivoVideo, miniaturaVideo } from "@/lib/homeschooling/video";

/** Mueve un elemento de una posición a otra (devuelve una copia) */
export function mover<T>(lista: T[], de: number, a: number): T[] {
  const copia = [...lista];
  const [x] = copia.splice(de, 1);
  copia.splice(a, 0, x);
  return copia;
}

export type PlanVista = { id: number; alumnoId: number; nombre: string; inicio: string; fin: string; estado: string; diasSemana: number[] };
export type AccionPlan = "pausar" | "reanudar" | "terminar" | "editar" | "quitar";

const ESTADO_PLAN: Record<string, string> = { activo: "Activo", pausado: "Pausado", finalizado: "Terminado" };

export default function CursoDetalle({
  module,
  userRole,
  planes,
  onLessonClick,
  onBack,
  materiaNombre,
  onAddRecording,
  onAddVarias,
  onDuplicar,
  onEditModule,
  onDeleteModule,
  onAsignar,
  onToggleLibre,
  onReordenarLecciones,
  onPlan,
}: {
  module: ModuleWithProgress;
  userRole: GroupRole | null;
  planes: PlanVista[];
  onLessonClick: (recordingId: number) => void;
  onBack: () => void;
  materiaNombre: string;
  onAddRecording: () => void;
  onAddVarias: () => void;
  onDuplicar: () => void;
  onEditModule: () => void;
  onDeleteModule: () => void;
  onAsignar: () => void;
  onToggleLibre: (libre: boolean) => void;
  onReordenarLecciones: (idsEnOrden: number[]) => void;
  onPlan: (plan: PlanVista, accion: AccionPlan) => void;
}) {
  const canManage = hasPermission(userRole, "editar_curso");
  const recordings = module.recordings ?? [];
  const conLecciones = module.tipo === "curso_videos" || module.tipo === "enlaces";
  // Material de una lección (lane 166)
  const [materialDe, setMaterialDe] = useState<{ id: number; title: string } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="outline" size="sm" onClick={onBack} aria-label={`Volver a ${materiaNombre}`} className="shrink-0">
          <ArrowLeft /> <span className="max-w-32 truncate">{materiaNombre}</span>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Más opciones del curso">
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onDuplicar}>
                  <Copy /> Duplicar curso
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`/api/homeschooling/cursos/${module.id}/exportar`} download>
                    <Download /> Exportar como archivo
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                <li key={p.id} className="flex items-center gap-2 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{p.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.inicio} → {p.fin} · {ESTADO_PLAN[p.estado] ?? p.estado}
                    </span>
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Opciones del plan de ${p.nombre}`}>
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {p.estado === "activo" && <DropdownMenuItem onSelect={() => onPlan(p, "pausar")}>Pausar</DropdownMenuItem>}
                      {p.estado !== "activo" && <DropdownMenuItem onSelect={() => onPlan(p, "reanudar")}>Reanudar</DropdownMenuItem>}
                      {p.estado !== "finalizado" && <DropdownMenuItem onSelect={() => onPlan(p, "terminar")}>Dar por terminado</DropdownMenuItem>}
                      <DropdownMenuItem onSelect={() => onPlan(p, "editar")}>Cambiar fecha de fin y días</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => onPlan(p, "quitar")}>
                        Quitar el plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={onAddVarias}>
                  <ListPlus /> Agregar varias
                </Button>
                <Button size="sm" onClick={onAddRecording}>
                  <Plus /> Agregar lección
                </Button>
              </div>
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
              {recordings.map((recording, indice) => {
                const miniatura =
                  recording.thumbnail_url ??
                  (recording.video_platform && recording.video_id ? miniaturaVideo(recording.video_platform, recording.video_id) : null);
                return (
                  <div key={recording.id} className="flex items-center hover:bg-muted">
                  <button
                    onClick={() => onLessonClick(recording.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors"
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
                        {recording.video_id || esArchivoVideo(recording.video_url) ? <Play className="size-5 text-foreground/80" fill="currentColor" /> : <FileText className="size-5 text-muted-foreground" />}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-sm font-medium text-foreground">
                        {recording.display_order}. {recording.title}
                      </h4>
                      {recording.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{recording.description}</p>}
                    </div>
                  </button>
                  {canManage && (
                    <Button variant="ghost" size="icon-sm" aria-label={`Material de «${recording.title}»`} title="Material de la lección" onClick={() => setMaterialDe({ id: recording.id, title: recording.title })}>
                      <Paperclip />
                    </Button>
                  )}
                  {canManage && recordings.length > 1 && (
                    <div className="flex shrink-0 flex-col pr-2">
                      <Button variant="ghost" size="icon-xs" aria-label={`Subir «${recording.title}»`} disabled={indice === 0} onClick={() => onReordenarLecciones(mover(recordings.map((r) => r.id), indice, indice - 1))}>
                        <ArrowUp />
                      </Button>
                      <Button variant="ghost" size="icon-xs" aria-label={`Bajar «${recording.title}»`} disabled={indice === recordings.length - 1} onClick={() => onReordenarLecciones(mover(recordings.map((r) => r.id), indice, indice + 1))}>
                        <ArrowDown />
                      </Button>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      <Sheet open={!!materialDe} onOpenChange={(o) => !o && setMaterialDe(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Material de la lección</SheetTitle>
            <SheetDescription>{materialDe?.title}</SheetDescription>
          </SheetHeader>
          {materialDe && (
            <div className="px-4 pb-4">
              <ListaMaterial key={materialDe.id} destino={{ leccionId: materialDe.id }} contexto={`la lección «${materialDe.title}»`} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
