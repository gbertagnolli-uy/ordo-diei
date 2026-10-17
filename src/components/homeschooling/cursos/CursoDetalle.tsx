"use client";

// Portado de vendor/roost/src/components/groups/learn/ModuleDetail.tsx (msrbuilds/roost@492af47; ampliado en lane 230).
// Cambios: constructor de curso y clases paso a paso (estilo Circle / Thinkific enfocado en tareas) — cada clase muestra
// accesos directos para cargar materiales (texto, imagen, video, archivos), armar su Quiz/Evaluación (Assessment)
// e imprimir la hoja de evaluación o la clase en A4.

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Copy,
  Download,
  Edit2,
  EllipsisVertical,
  FileText,
  Image as ImageIcon,
  Layers,
  ListPlus,
  Paperclip,
  Play,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ListaMaterial from "@/components/homeschooling/material/ListaMaterial";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { ModuleWithProgress, RecordingWithCompletion } from "@/lib/homeschooling/roost/tipos";
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
  onEditRecording,
  onQuizRecording,
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
  onEditRecording?: (rec: RecordingWithCompletion) => void;
  onQuizRecording?: (rec: RecordingWithCompletion) => void;
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
  // Material de una lección (lane 166 / lane 230)
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
            <Progress value={module.progress_percentage} aria-label={`Avance de ${module.title}`} />
            <p className="text-xs text-muted-foreground">
              {module.progress_percentage}% completado · Aprobación de quizzes: {module.umbral_aprobacion}%
            </p>
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
              {module.total_unidades < 1 ? "Cargá clases para poder asignar el curso al plan de un alumno." : "Nadie tiene este curso asignado todavía."}
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

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
          <div>
            <span className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Layers className="size-4" /> Constructor de clases y evaluaciones ({recordings.length})
            </span>
            <p className="text-xs text-muted-foreground">
              Ordená las clases paso a paso. Cada clase puede tener tarea/texto, imagen, video embebido, documentos descargables y quiz/assessment imprimible.
            </p>
          </div>
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              {conLecciones && (
                <Button size="sm" variant="outline" onClick={onAddVarias}>
                  <ListPlus /> Agregar varias
                </Button>
              )}
              <Button size="sm" onClick={onAddRecording}>
                <Plus /> Nueva clase / evaluación
              </Button>
            </div>
          )}
        </div>

        {recordings.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Layers />
              </EmptyMedia>
              <EmptyTitle>Todavía no armaste clases en este curso</EmptyTitle>
              <EmptyDescription>
                Creá la primera clase con tarea escrita, imagen, video embebido, documentos descargables o un quiz/assessment imprimible.
              </EmptyDescription>
            </EmptyHeader>
            {canManage && (
              <EmptyContent>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={onAddRecording}>
                    <Plus /> Crear primera clase
                  </Button>
                  {conLecciones && (
                    <Button variant="outline" onClick={onAddVarias}>
                      <ListPlus /> Cargar varias en lote
                    </Button>
                  )}
                </div>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <div className="divide-y rounded-xl border bg-card">
            {recordings.map((recording, indice) => {
              const miniatura =
                recording.thumbnail_url ??
                (recording.video_platform && recording.video_id ? miniaturaVideo(recording.video_platform, recording.video_id) : null);
              const tieneVideo = Boolean(recording.video_id || esArchivoVideo(recording.video_url));
              const tieneImagenPropia = Boolean(recording.thumbnail_url && !recording.thumbnail_url.includes("ytimg.com"));

              return (
                <div key={recording.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50 sm:flex-nowrap">
                  <button
                    onClick={() => onLessonClick(recording.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
                  >
                    {recording.is_completed ? (
                      <CheckCircle2 className="size-5 shrink-0 text-success" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground/60" />
                    )}

                    <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
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
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        {tieneVideo ? (
                          <Play className="size-5 text-foreground/90" fill="currentColor" />
                        ) : tieneImagenPropia ? (
                          <ImageIcon className="size-5 text-foreground/80" />
                        ) : (
                          <FileText className="size-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-sm font-semibold text-foreground">
                        {recording.display_order}. {recording.title}
                      </h4>
                      {recording.description ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{recording.description}</p>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted-foreground">Clic para abrir la clase, ver materiales o responder el quiz</p>
                      )}
                    </div>
                  </button>

                  {canManage && (
                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        aria-label={`Material de «${recording.title}»`}
                        title="Agregar textos, imágenes, videos o archivos descargables"
                        onClick={() => setMaterialDe({ id: recording.id, title: recording.title })}
                      >
                        <Paperclip className="size-3.5" /> Materiales
                      </Button>
                      {onQuizRecording && (
                        <Button
                          variant="outline"
                          size="xs"
                          aria-label={`Quiz de «${recording.title}»`}
                          title="Crear o editar Quiz / Evaluación"
                          onClick={() => onQuizRecording(recording)}
                        >
                          <ClipboardCheck className="size-3.5" /> Quiz / Eval.
                        </Button>
                      )}
                      <Button
                        asChild
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Imprimir «${recording.title}»`}
                        title="Imprimir evaluación u hoja de clase"
                      >
                        <Link href={`/dashboard/homeschooling/imprimir/quiz/${recording.id}?modo=alumno`} target="_blank">
                          <Printer className="size-4" />
                        </Link>
                      </Button>
                      {onEditRecording && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Editar «${recording.title}»`}
                          title="Editar clase"
                          onClick={() => onEditRecording(recording)}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                      )}
                      {recordings.length > 1 && (
                        <div className="flex shrink-0 flex-col">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Subir «${recording.title}»`}
                            disabled={indice === 0}
                            onClick={() => onReordenarLecciones(mover(recordings.map((r) => r.id), indice, indice - 1))}
                          >
                            <ArrowUp />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Bajar «${recording.title}»`}
                            disabled={indice === recordings.length - 1}
                            onClick={() => onReordenarLecciones(mover(recordings.map((r) => r.id), indice, indice + 1))}
                          >
                            <ArrowDown />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Sheet open={!!materialDe} onOpenChange={(o) => !o && setMaterialDe(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Materiales y bloques de la clase</SheetTitle>
            <SheetDescription>{materialDe?.title}</SheetDescription>
          </SheetHeader>
          {materialDe && (
            <div className="px-4 pb-6">
              <ListaMaterial key={materialDe.id} destino={{ leccionId: materialDe.id }} contexto={`la clase «${materialDe.title}»`} expandido />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
