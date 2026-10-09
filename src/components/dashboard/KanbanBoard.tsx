"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Kanban,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Flame,
  CheckSquare,
  ArrowRight,
  MoreVertical,
  X,
  User,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  Activity,
  Maximize2,
  Tag,
} from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import { ChecklistModal } from "./ChecklistModal";
import { cn } from "@/lib/utils";

type CoResponsableMap = Record<
  number,
  { id: number; nombre: string; fotoUrl: string | null }[]
>;

type KanbanStage = "pending" | "in_progress" | "review" | "completed";

interface ColumnDef {
  id: KanbanStage;
  title: string;
  icon: React.ReactNode;
  headerColor: string;
  badgeColor: string;
}

const COLUMNS: ColumnDef[] = [
  {
    id: "pending",
    title: "Pendientes",
    icon: <Clock className="w-4 h-4 text-amber-500" />,
    headerColor: "border-t-amber-500",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    id: "in_progress",
    title: "En Progreso",
    icon: <Flame className="w-4 h-4 text-blue-500" />,
    headerColor: "border-t-blue-500",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "review",
    title: "En Revisión",
    icon: <AlertCircle className="w-4 h-4 text-purple-500" />,
    headerColor: "border-t-purple-500",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    id: "completed",
    title: "Completadas",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    headerColor: "border-t-emerald-500",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

export function KanbanBoard({
  tasks,
  coResponsables = {},
  onTaskCompleted,
}: {
  tasks: any[];
  coResponsables?: CoResponsableMap;
  onTaskCompleted?: () => void;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Group tasks into stages
  const getStageForTask = (task: any): KanbanStage => {
    if (task.estado === "Completada" || task.estado === "Aprobada") {
      return "completed";
    }
    if (task.estado === "Esperando_Aprobacion") {
      return "review";
    }
    if (task.estado === "En_progreso") {
      return "in_progress";
    }
    return "pending";
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="w-full bg-[var(--surface-container-lowest)] rounded-2xl border border-[color-mix(in-srgb,var(--outline-variant)_18%,transparent)] shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden transition-colors relative">
      {/* Kanban Header */}
      <div className="px-6 py-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] bg-[var(--surface-container-low)]/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] text-[var(--on-secondary)] flex items-center justify-center font-bold shadow-sm">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--on-surface)] tracking-tight">
              Kanban 4 — Tablero con Card Detail Panel
            </h2>
            <p className="text-xs text-[var(--on-surface-variant)]">
              Flujo visual por etapas con panel lateral para control y actividad
            </p>
          </div>
        </div>

        <div className="text-xs font-mono font-bold text-[var(--on-surface-variant)] bg-[var(--surface-container)] px-3 py-1.5 rounded-lg border border-[color-mix(in-srgb,var(--outline-variant)_20%,transparent)]">
          Total: {tasks.length} tareas
        </div>
      </div>

      {/* Main Board + Slide Panel Container */}
      <div className="flex relative overflow-hidden min-h-[660px]">
        {/* Kanban Board Grid */}
        <div
          className={cn(
            "flex-1 p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 overflow-x-auto transition-all",
            isSidePanelOpen && "xl:mr-[400px]"
          )}
        >
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => getStageForTask(t) === col.id);

            return (
              <div
                key={col.id}
                className={cn(
                  "bg-[var(--surface-container-low)]/40 rounded-xl p-3 border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] flex flex-col min-w-[260px] border-t-4",
                  col.headerColor
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-2 mb-3">
                  <div className="flex items-center gap-2 font-headline font-bold text-sm text-[var(--on-surface)]">
                    {col.icon}
                    <span>{col.title}</span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono font-bold px-2 py-0.5 rounded-full",
                      col.badgeColor
                    )}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-10 px-2 border-2 border-dashed border-[color-mix(in-srgb,var(--outline-variant)_20%,transparent)] rounded-xl my-auto">
                      <span className="text-xs text-[var(--on-surface-variant)] italic">
                        Sin tareas aquí
                      </span>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const isSelected = task.id === selectedTaskId && isSidePanelOpen;
                      const checklistTotal = task.checklistItems?.length || 0;
                      const checklistDone =
                        task.checklistItems?.filter((ci: any) => ci.completado).length || 0;

                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            setSelectedTaskId(task.id);
                            setIsSidePanelOpen(true);
                          }}
                          className={cn(
                            "group p-3.5 rounded-xl border bg-[var(--surface-container-lowest)] transition-all cursor-pointer shadow-sm hover:shadow-md relative",
                            isSelected
                              ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30 bg-[var(--surface-container-low)]/50"
                              : "border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] hover:border-[var(--primary)]/40"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-title font-bold text-sm text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                              {task.titulo}
                            </h4>
                            <span className="text-[11px] font-bold text-[var(--warning)] bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] px-1.5 py-0.5 rounded shrink-0">
                              +{task.puntosGenerados || 10}
                            </span>
                          </div>

                          {task.descripcion && (
                            <p className="text-xs text-[var(--on-surface-variant)] line-clamp-2 mb-3">
                              {task.descripcion}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs text-[var(--on-surface-variant)] pt-2 border-t border-[color-mix(in-srgb,var(--outline-variant)_10%,transparent)]">
                            <div className="flex items-center gap-2">
                              {task.horaEjecucion && (
                                <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--secondary)] font-bold">
                                  <Clock className="w-3 h-3" />
                                  {new Date(task.horaEjecucion).toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                              {checklistTotal > 0 && (
                                <span className="flex items-center gap-1 font-mono text-[10px] text-indigo-500 font-bold">
                                  <CheckSquare className="w-3 h-3" />
                                  {checklistDone}/{checklistTotal}
                                </span>
                              )}
                            </div>

                            {task.timerStartedAt ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 animate-pulse">
                                <Play className="w-2.5 h-2.5 fill-current" />
                                Activa
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                                Ver detalle →
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* =========================================
            Card Detail Side Panel (Kanban 4 Inspector)
            ========================================= */}
        {isSidePanelOpen && selectedTask && (
          <aside className="w-full xl:w-[400px] border-l border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] bg-[var(--surface-container-lowest)] p-6 fixed inset-y-0 right-0 xl:absolute xl:top-0 xl:bottom-0 shadow-2xl xl:shadow-none z-50 overflow-y-auto flex flex-col justify-between transition-transform">
            <KanbanCardDetailSidePanel
              task={selectedTask}
              coResponsables={coResponsables[selectedTask.id] || []}
              onClose={() => setIsSidePanelOpen(false)}
              onCompleted={() => {
                onTaskCompleted?.();
              }}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Kanban 4 Card Detail Side Panel
 */
function KanbanCardDetailSidePanel({
  task,
  coResponsables,
  onClose,
  onCompleted,
}: {
  task: any;
  coResponsables: { id: number; nombre: string; fotoUrl: string | null }[];
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { openModal } = useModalStore();

  const getInitialElapsed = () => {
    if (task.timerStartedAt) {
      const serverElapsed = task.tiempoAcumuladoTimer || 0;
      const liveElapsed = Math.floor(
        (Date.now() - new Date(task.timerStartedAt).getTime()) / 1000
      );
      return serverElapsed + liveElapsed;
    }
    return task.tiempoAcumuladoTimer || task.tiempoRealEjecucionSeg || 0;
  };

  const [isPlaying, setIsPlaying] = useState(!!task.timerStartedAt);
  const [elapsed, setElapsed] = useState(getInitialElapsed);
  const [loading, setLoading] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsPlaying(!!task.timerStartedAt);
    setElapsed(getInitialElapsed());
  }, [task.id, task.timerStartedAt]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsed((prev: number) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    if (!isPlaying) {
      try {
        await fetch(`/api/tasks/${task.id}/timer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        });
      } catch {}
      setIsPlaying(true);
    } else {
      try {
        const res = await fetch(`/api/tasks/${task.id}/timer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pause" }),
        });
        if (res.ok) {
          const data = await res.json();
          setElapsed(data.tiempoAcumulado);
        }
      } catch {}
      setIsPlaying(false);
    }
  };

  const finishTask = async () => {
    if (!confirm("¿Deseas marcar esta tarea como completada?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: elapsed }),
      });

      if (res.ok) {
        const data = await res.json();
        openModal("TASK_SUCCESS", {
          mensaje: data.mensaje,
          puntos: data.puntos,
          basePoints: data.basePoints,
          streakBonus: data.streakBonus,
          isNewStreak: data.isNewStreak,
          streakDays: data.streakDays,
          isHappyHour: data.isHappyHour,
        });
        onCompleted();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Error al completar la tarea.");
      }
    } catch (e: any) {
      alert("Error de conexión: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const checklistItems = task.checklistItems || [];
  const isDone = task.estado === "Completada" || task.estado === "Aprobada";

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar of Side Panel */}
      <div className="flex items-center justify-between pb-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--on-surface-variant)]">
            Ficha de Tarea
          </span>
          <span className="text-xs font-mono font-bold text-[var(--primary)] bg-[color-mix(in-srgb,var(--primary)_8%,transparent)] px-2 py-0.5 rounded">
            #{task.id}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] transition-colors"
          title="Cerrar panel lateral"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Title & Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]">
              {task.estado}
            </span>
            <span className="text-xs font-mono font-bold text-[var(--warning)] bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] px-2 py-0.5 rounded">
              +{task.puntosGenerados || 10} pts
            </span>
          </div>
          <h3 className="font-display font-bold text-2xl text-[var(--on-surface)] leading-tight">
            {task.titulo}
          </h3>
          {task.descripcion && (
            <p className="text-sm text-[var(--on-surface-variant)] mt-2 whitespace-pre-line leading-relaxed">
              {task.descripcion}
            </p>
          )}
        </div>

        {/* Stopwatch Controller */}
        <div className="p-4 rounded-xl bg-[var(--surface-container)] border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--on-surface)] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--primary)]" />
              Cronómetro Activo
            </span>
            <span className="text-xs font-mono text-[var(--on-surface-variant)]">
              Estimado: {Math.round((task.tiempoEjecucionEstimadoSeg || 0) / 60)}m
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="font-mono text-3xl font-extrabold text-[var(--primary)]">
              {formatSeconds(elapsed)}
            </div>

            {!isDone && (
              <button
                onClick={togglePlay}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-sm",
                  isPlaying
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-[var(--primary)] hover:bg-[var(--primary-container)] text-[var(--on-primary)]"
                )}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Iniciar
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Subitems / Checklist */}
        {checklistItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                Submisiones ({checklistItems.filter((i: any) => i.completado).length}/
                {checklistItems.length})
              </span>
              <button
                onClick={() => setIsChecklistOpen(true)}
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {checklistItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--surface-container)] text-xs text-[var(--on-surface)]"
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded flex items-center justify-center shrink-0 font-bold text-[10px]",
                      item.completado
                        ? "bg-emerald-500 text-white"
                        : "bg-neutral-300 dark:bg-neutral-700"
                    )}
                  >
                    {item.completado && "✓"}
                  </span>
                  <span
                    className={cn(
                      "truncate flex-1",
                      item.completado && "line-through opacity-60"
                    )}
                  >
                    {item.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Co-responsables */}
        {coResponsables.length > 0 && (
          <div>
            <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block mb-2">
              Colaboradores de grupo
            </span>
            <div className="flex flex-wrap gap-2">
              {coResponsables.map((co) => (
                <div
                  key={co.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-container)] text-xs font-medium text-[var(--on-surface)]"
                >
                  <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] flex items-center justify-center text-[10px] font-bold">
                    {co.nombre.charAt(0)}
                  </span>
                  <span>{co.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-8 pt-4 border-t border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
        {!isDone ? (
          <button
            onClick={finishTask}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[var(--success)] hover:bg-[var(--success-container)] text-[var(--on-success)] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? "Completando..." : "Completar Tarea"}
          </button>
        ) : (
          <div className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Misión Finalizada
          </div>
        )}
      </div>

      {isChecklistOpen && (
        <ChecklistModal
          isOpen={isChecklistOpen}
          onClose={() => setIsChecklistOpen(false)}
          taskId={task.id}
          taskTitle={task.titulo}
          onComplete={() => {
            onCompleted();
          }}
        />
      )}
    </div>
  );
}
