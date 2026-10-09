"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  CheckSquare,
  ChevronRight,
  Flame,
  Calendar,
  User,
  ListChecks,
  SlidersHorizontal,
  X,
  Layers,
  Sparkles,
  Award,
} from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import { ChecklistModal } from "./ChecklistModal";
import { cn } from "@/lib/utils";

type CoResponsableMap = Record<
  number,
  { id: number; nombre: string; fotoUrl: string | null }[]
>;

type FilterType =
  | "all"
  | "pending"
  | "in_progress"
  | "review"
  | "completed"
  | "today"
  | "checklist";

export function AppShellTaskList({
  tasks,
  coResponsables = {},
  onTaskCompleted,
}: {
  tasks: any[];
  coResponsables?: CoResponsableMap;
  onTaskCompleted?: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isContextOpen, setIsContextOpen] = useState(true);

  // Grouped task categories
  const pendingTasks = tasks.filter(
    (t) =>
      t.estado !== "Completada" &&
      t.estado !== "Aprobada" &&
      t.estado !== "Esperando_Aprobacion" &&
      t.estado !== "En_progreso"
  );
  const inProgressTasks = tasks.filter((t) => t.estado === "En_progreso");
  const reviewTasks = tasks.filter((t) => t.estado === "Esperando_Aprobacion");
  const completedTasks = tasks.filter(
    (t) => t.estado === "Completada" || t.estado === "Aprobada"
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter((t) => {
    if (!t.fechaVencimiento && !t.horaEjecucion) return false;
    const dateStr = (t.fechaVencimiento || t.horaEjecucion).slice(0, 10);
    return dateStr === todayStr;
  });
  const checklistTasks = tasks.filter((t) => (t.checklistItems?.length || 0) > 0);

  // Filter application
  const filteredTasks = tasks.filter((task) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.titulo?.toLowerCase().includes(q);
      const matchDesc = task.descripcion?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Filter
    switch (activeFilter) {
      case "pending":
        return pendingTasks.includes(task);
      case "in_progress":
        return inProgressTasks.includes(task);
      case "review":
        return reviewTasks.includes(task);
      case "completed":
        return completedTasks.includes(task);
      case "today":
        return todayTasks.includes(task);
      case "checklist":
        return checklistTasks.includes(task);
      case "all":
      default:
        return true;
    }
  }).sort((a, b) => {
    if (a.horaEjecucion && !b.horaEjecucion) return -1;
    if (!a.horaEjecucion && b.horaEjecucion) return 1;
    if (a.horaEjecucion && b.horaEjecucion) {
      return new Date(a.horaEjecucion).getTime() - new Date(b.horaEjecucion).getTime();
    }
    return 0;
  });

  // Default select first task if none selected or if selected is filtered out
  useEffect(() => {
    if (filteredTasks.length > 0) {
      if (!selectedTaskId || !filteredTasks.some((t) => t.id === selectedTaskId)) {
        setSelectedTaskId(filteredTasks[0].id);
      }
    } else {
      setSelectedTaskId(null);
    }
  }, [activeFilter, searchQuery, tasks]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="w-full bg-[var(--surface-container-lowest)] rounded-2xl border border-[color-mix(in-srgb,var(--outline-variant)_18%,transparent)] shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden transition-colors">
      {/* App Shell Header Bar */}
      <div className="px-6 py-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] bg-[var(--surface-container-low)]/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] flex items-center justify-center font-bold shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--on-surface)] tracking-tight">
              App Shell — Vista Lista de Tareas
            </h2>
            <p className="text-xs text-[var(--on-surface-variant)]">
              Panel tri-columna con inspector contextual de alta precisión
            </p>
          </div>
        </div>

        {/* Global Task Search */}
        <div className="relative min-w-[240px] max-w-sm flex-1 sm:flex-initial">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" />
          <input
            type="text"
            placeholder="Buscar por título o detalle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-[var(--surface)] text-[var(--on-surface)] border border-[color-mix(in-srgb,var(--outline-variant)_20%,transparent)] focus:outline-none focus:border-[var(--secondary)] placeholder:text-[var(--on-surface-variant)]/60"
          />
        </div>
      </div>

      {/* Three Columns Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* =========================================
            COLUMN 1: Left Navigation & Filters (3 cols)
            ========================================= */}
        <aside className="lg:col-span-3 border-r border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] bg-[var(--surface-container-low)]/30 p-4 flex flex-col gap-6">
          <div>
            <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider px-3 mb-2 block">
              Vistas Principales
            </span>
            <div className="flex flex-col gap-1">
              <FilterButton
                active={activeFilter === "pending"}
                onClick={() => setActiveFilter("pending")}
                icon={<Clock className="w-4 h-4 text-amber-500" />}
                label="Pendientes"
                count={pendingTasks.length}
              />
              <FilterButton
                active={activeFilter === "in_progress"}
                onClick={() => setActiveFilter("in_progress")}
                icon={<Flame className="w-4 h-4 text-blue-500" />}
                label="En Progreso"
                count={inProgressTasks.length}
              />
              <FilterButton
                active={activeFilter === "review"}
                onClick={() => setActiveFilter("review")}
                icon={<AlertCircle className="w-4 h-4 text-purple-500" />}
                label="En Revisión"
                count={reviewTasks.length}
              />
              <FilterButton
                active={activeFilter === "completed"}
                onClick={() => setActiveFilter("completed")}
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                label="Completadas"
                count={completedTasks.length}
              />
              <FilterButton
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
                icon={<Layers className="w-4 h-4 text-[var(--primary)]" />}
                label="Todas las Tareas"
                count={tasks.length}
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider px-3 mb-2 block">
              Filtros Rápidos
            </span>
            <div className="flex flex-col gap-1">
              <FilterButton
                active={activeFilter === "today"}
                onClick={() => setActiveFilter("today")}
                icon={<Calendar className="w-4 h-4 text-[var(--secondary)]" />}
                label="Para Hoy"
                count={todayTasks.length}
              />
              <FilterButton
                active={activeFilter === "checklist"}
                onClick={() => setActiveFilter("checklist")}
                icon={<CheckSquare className="w-4 h-4 text-indigo-500" />}
                label="Con Checklist"
                count={checklistTasks.length}
              />
            </div>
          </div>

          <div className="mt-auto p-4 rounded-xl bg-[var(--surface-container)] border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[var(--secondary)]" />
              <span className="text-xs font-bold text-[var(--on-surface)]">
                Modo Productivo
              </span>
            </div>
            <p className="text-[11px] text-[var(--on-surface-variant)] leading-relaxed">
              Selecciona cualquier tarea para inspeccionar su cronómetro, checklist y reglas de gamificación en el panel contextual.
            </p>
          </div>
        </aside>

        {/* =========================================
            COLUMN 2: Center Task Feed Stream (5 cols)
            ========================================= */}
        <section
          className={cn(
            "p-4 lg:p-6 overflow-y-auto max-h-[720px] transition-all",
            isContextOpen && selectedTask
              ? "lg:col-span-5 border-r border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]"
              : "lg:col-span-9"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline font-bold text-lg text-[var(--on-surface)] flex items-center gap-2">
              <span>{getFilterTitle(activeFilter)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] font-mono font-bold">
                {filteredTasks.length}
              </span>
            </h3>

            {!isContextOpen && selectedTask && (
              <button
                onClick={() => setIsContextOpen(true)}
                className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <span>Abrir Context Panel</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-container)] flex items-center justify-center mx-auto mb-3 text-2xl">
                🍃
              </div>
              <h4 className="font-bold text-[var(--on-surface)] text-base mb-1">
                No hay tareas en esta categoría
              </h4>
              <p className="text-xs text-[var(--on-surface-variant)] max-w-sm mx-auto">
                No se encontraron tareas con los filtros actuales o la búsqueda. ¡Buen momento para descansar o añadir una nueva misión!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredTasks.map((task) => {
                const isSelected = task.id === selectedTaskId;
                const checklistTotal = task.checklistItems?.length || 0;
                const checklistDone =
                  task.checklistItems?.filter((ci: any) => ci.completado).length || 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setIsContextOpen(true);
                    }}
                    className={cn(
                      "group p-4 rounded-xl border transition-all cursor-pointer relative",
                      isSelected
                        ? "bg-[var(--surface-container-low)] border-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]"
                        : "bg-[var(--surface-container-lowest)] border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-container-low)]/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge estado={task.estado} />
                          {task.horaEjecucion && (
                            <span className="text-[11px] font-mono font-bold text-[var(--secondary)] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(task.horaEjecucion).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <h4 className="font-title font-bold text-[var(--on-surface)] text-sm sm:text-base truncate group-hover:text-[var(--primary)] transition-colors">
                          {task.titulo}
                        </h4>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-bold text-[var(--warning)] bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] px-2 py-0.5 rounded-md">
                          +{task.puntosGenerados || 10} pts
                        </span>
                      </div>
                    </div>

                    {task.descripcion && (
                      <p className="text-xs text-[var(--on-surface-variant)] line-clamp-2 mb-3">
                        {task.descripcion}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-[var(--on-surface-variant)] pt-2 border-t border-[color-mix(in-srgb,var(--outline-variant)_10%,transparent)]">
                      <div className="flex items-center gap-3">
                        {checklistTotal > 0 && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                            {checklistDone}/{checklistTotal}
                          </span>
                        )}
                        {task.timerStartedAt && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold animate-pulse text-[11px]">
                            <Play className="w-3 h-3 fill-current" />
                            En marcha
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-medium text-[var(--primary)] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Ver ficha <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================================
            COLUMN 3: Context Panel (Inspector) (4 cols)
            ========================================= */}
        {isContextOpen && selectedTask && (
          <aside className="lg:col-span-4 bg-[var(--surface-container-low)]/50 p-6 flex flex-col justify-between overflow-y-auto max-h-[720px]">
            <TaskContextInspector
              task={selectedTask}
              coResponsables={coResponsables[selectedTask.id] || []}
              onClose={() => setIsContextOpen(false)}
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

function FilterButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full text-left",
        active
          ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-sm font-bold"
          : "text-[var(--on-surface)] hover:bg-[color-mix(in-srgb,var(--primary)_8%,transparent)]"
      )}
    >
      <div className="flex items-center gap-2.5 truncate">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <span
        className={cn(
          "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold",
          active
            ? "bg-[var(--primary-container)] text-[var(--on-primary)]"
            : "bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; className: string }> = {
    Pendiente: {
      label: "Pendiente",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    En_progreso: {
      label: "En Progreso",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    Esperando_Aprobacion: {
      label: "En Revisión",
      className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    Completada: {
      label: "Completada",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    Aprobada: {
      label: "Aprobada",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    Vencida: {
      label: "Vencida",
      className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    Pausada: {
      label: "Pausada",
      className: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
    },
  };

  const current = map[estado] || {
    label: estado,
    className: "bg-neutral-500/10 text-neutral-600 border-neutral-500/20",
  };

  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
        current.className
      )}
    >
      {current.label}
    </span>
  );
}

function getFilterTitle(filter: FilterType) {
  switch (filter) {
    case "pending":
      return "Tareas Pendientes";
    case "in_progress":
      return "Tareas en Progreso";
    case "review":
      return "Esperando Aprobación";
    case "completed":
      return "Tareas Completadas";
    case "today":
      return "Misiones para Hoy";
    case "checklist":
      return "Tareas con Subítems";
    case "all":
    default:
      return "Todas las Tareas";
  }
}

/**
 * Context Inspector Component (Right Column of App Shell 4)
 */
function TaskContextInspector({
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
      {/* Header Inspector */}
      <div className="flex items-center justify-between pb-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] mb-4">
        <div className="flex items-center gap-2">
          <StatusBadge estado={task.estado} />
          <span className="text-xs font-mono font-bold text-[var(--warning)] bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] px-2 py-0.5 rounded-md">
            +{task.puntosGenerados || 10} pts
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] transition-colors"
          title="Cerrar panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Task Title & Description */}
      <div className="mb-6">
        <h3 className="font-display font-bold text-xl text-[var(--on-surface)] mb-2 leading-snug">
          {task.titulo}
        </h3>
        <p className="text-sm text-[var(--on-surface-variant)] whitespace-pre-line leading-relaxed">
          {task.descripcion || "Sin descripción adicional provista."}
        </p>
      </div>

      {/* Persistent Timer Section */}
      <div className="p-4 rounded-xl bg-[var(--surface-container)] border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-bold text-[var(--on-surface)] uppercase tracking-wider">
              Cronómetro de Misión
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--on-surface-variant)]">
            Est: {Math.round((task.tiempoEjecucionEstimadoSeg || 0) / 60)} min
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="font-mono text-3xl font-extrabold text-[var(--primary)] tracking-wider">
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

      {/* Checklist items quick preview */}
      {checklistItems.length > 0 && (
        <div className="mb-6">
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
              Gestionar
            </button>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {checklistItems.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-container)] text-xs text-[var(--on-surface)]"
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded flex items-center justify-center shrink-0 text-white font-bold text-[10px]",
                    item.completado ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"
                  )}
                >
                  {item.completado && "✓"}
                </div>
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

      {/* Co-responsables if any */}
      {coResponsables.length > 0 && (
        <div className="mb-6">
          <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block mb-2">
            Compañeros en grupo
          </span>
          <div className="flex items-center gap-2">
            {coResponsables.map((co) => (
              <div
                key={co.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-container)] text-xs font-medium text-[var(--on-surface)]"
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

      {/* Action Footer */}
      <div className="mt-auto pt-4 border-t border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] flex flex-col gap-2">
        {!isDone ? (
          <button
            onClick={finishTask}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[var(--success)] hover:bg-[var(--success-container)] text-[var(--on-success)] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? "Completando..." : "Completar Misión"}
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
