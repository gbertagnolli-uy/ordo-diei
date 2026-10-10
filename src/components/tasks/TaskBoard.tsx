"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { GripVertical, ListChecks, Timer } from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Avatar } from "./primitives";
import {
  CoResponsable,
  CoResponsableMap,
  TaskGroup,
  GROUP_LABEL,
  checklistProgress,
  formatDue,
  isLate,
  isUrgent,
  pointsLabel,
  sortTasks,
  taskGroup,
} from "./taskUtils";

const COLUMNS: { id: TaskGroup; color: string }[] = [
  { id: "todo", color: "var(--on-surface-variant)" },
  { id: "progress", color: "var(--secondary)" },
  { id: "review", color: "var(--primary)" },
  { id: "done", color: "var(--success)" },
];

// Las completadas se acumulan con el tiempo: el tablero muestra solo las más recientes
const DONE_LIMIT = 12;

// Movimientos permitidos entre columnas. Cada uno reutiliza la acción original de la tarea,
// así que las reglas (checklist completo, aprobación de padres) son las mismas que en los botones.
function canMove(from: TaskGroup, to: TaskGroup, isParent: boolean) {
  if (from === to) return false;
  if ((from === "todo" && to === "progress") || (from === "progress" && to === "todo")) return true;
  if ((from === "todo" || from === "progress") && to === "review") return true;
  if (from === "review" && (to === "done" || to === "todo")) return isParent;
  return false;
}

// Estado que se muestra mientras el servidor confirma el movimiento
function optimisticPatch(to: TaskGroup, task: any) {
  switch (to) {
    case "progress": return { estado: "En_progreso", timerStartedAt: new Date().toISOString() };
    case "todo": return { estado: task.estado === "Esperando_Aprobacion" ? "Rechazada" : "Pausada", timerStartedAt: null };
    case "review": return { estado: "Esperando_Aprobacion", timerStartedAt: null };
    case "done": return { estado: "Aprobada" };
  }
}

function elapsedSeconds(task: any) {
  const live = task.timerStartedAt ? Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000) : 0;
  return (task.tiempoAcumuladoTimer || 0) + live;
}

// Réplica de React Bits Pro "Kanban 4": tablero por estado, con tarjetas arrastrables entre columnas.
// El detalle se abre en el panel de contexto.
export function TaskBoard({
  tasks,
  coResponsables,
  selectedId,
  onSelect,
  isParent,
}: {
  tasks: any[];
  coResponsables: CoResponsableMap;
  selectedId: number | null;
  onSelect: (task: any) => void;
  isParent: boolean;
}) {
  const router = useRouter();
  const { openModal } = useModalStore();
  const [, startTransition] = useTransition();
  const [board, applyMove] = useOptimistic(tasks, (list, m: { id: number; to: TaskGroup }) =>
    list.map((t) => (t.id === m.id ? { ...t, ...optimisticPatch(m.to, t) } : t))
  );
  const [dragging, setDragging] = useState<any>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const request = async (task: any, from: TaskGroup, to: TaskGroup) => {
    const post = (action: string, body?: object) =>
      fetch(`/api/tasks/${task.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
    const timer = (action: "start" | "pause") =>
      fetch(`/api/tasks/${task.id}/timer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    if (to === "progress") return timer("start");
    if (to === "todo") return from === "review" ? post("reject") : timer("pause");
    if (to === "review") return post("complete", { elapsedSeconds: elapsedSeconds(task) });
    return post("approve");
  };

  const move = (task: any, from: TaskGroup, to: TaskGroup) => {
    startTransition(async () => {
      applyMove({ id: task.id, to });
      try {
        const res = await request(task, from, to);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(data.error || "No se pudo mover la tarea.");
          return;
        }
        setMessage(`${task.titulo} movida a ${GROUP_LABEL[to]}.`);
        if (to === "review") {
          openModal("TASK_SUCCESS", {
            mensaje: data.mensaje,
            puntos: data.puntos,
            basePoints: data.basePoints,
            streakBonus: data.streakBonus,
            isNewStreak: data.isNewStreak,
            streakDays: data.streakDays,
            isHappyHour: data.isHappyHour,
          });
        }
        router.refresh();
      } catch {
        setMessage("Error de conexión: no se pudo mover la tarea.");
      }
    });
  };

  const onDragStart = (e: DragStartEvent) => setDragging(board.find((t) => t.id === e.active.id) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const task = board.find((t) => t.id === e.active.id);
    const to = e.over?.id as TaskGroup | undefined;
    if (!task || !to) return;
    const from = taskGroup(task);
    if (from === to) return;
    if (!canMove(from, to, isParent)) {
      setMessage(`No se puede mover de ${GROUP_LABEL[from]} a ${GROUP_LABEL[to]}.`);
      return;
    }
    move(task, from, to);
  };

  const dragFrom = dragging ? taskGroup(dragging) : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
    <div className="h-full overflow-x-auto">
      <div className="flex h-full gap-3 px-4 pb-4">
        {COLUMNS.map((col) => {
          const all = sortTasks(board.filter((t) => taskGroup(t) === col.id), col.id === "done" ? "done" : null);
          const shown = col.id === "done" ? all.slice(0, DONE_LIMIT) : all;
          return (
            <Column key={col.id} id={col.id} droppable={!!dragFrom && canMove(dragFrom, col.id, isParent)} dragging={!!dragFrom}>
              <header className="flex h-10 shrink-0 items-center gap-2 px-3">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ background: col.color }} />
                <h2 className="text-sm font-medium">{GROUP_LABEL[col.id]}</h2>
                <Badge variant="outline" className="ml-auto h-5 tabular-nums">{all.length}</Badge>
              </header>
              <ScrollArea className="min-h-0 flex-1">
                <ul className="space-y-2 px-2 pb-2">
                  {shown.length === 0 && (
                    <li className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">Sin tareas</li>
                  )}
                  {shown.map((task) => (
                    <li key={task.id}>
                      <BoardCard task={task} team={coResponsables[task.id] || []} active={task.id === selectedId} onSelect={onSelect} />
                    </li>
                  ))}
                  {all.length > shown.length && (
                    <li className="px-2 py-1 text-xs text-muted-foreground">y {all.length - shown.length} más en «Completadas»</li>
                  )}
                </ul>
              </ScrollArea>
            </Column>
          );
        })}
      </div>
    </div>
    <DragOverlay>{dragging && <BoardCard task={dragging} team={coResponsables[dragging.id] || []} active={false} onSelect={() => {}} overlay />}</DragOverlay>
    <p aria-live="polite" className="sr-only">{message}</p>
    {message && <p role="status" className="pointer-events-none absolute inset-x-4 bottom-2 mx-auto w-fit max-w-full rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-md">{message}</p>}
    </DndContext>
  );
}

function Column({ id, droppable, dragging, children }: { id: TaskGroup; droppable: boolean; dragging: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !droppable });
  return (
    <section
      ref={setNodeRef}
      aria-label={GROUP_LABEL[id]}
      className={cn(
        "flex min-w-[11.5rem] max-w-80 flex-1 flex-col rounded-xl bg-muted/60 transition-all",
        dragging && !droppable && "opacity-50",
        droppable && "ring-1 ring-primary/30",
        isOver && "bg-primary/10 ring-2 ring-primary"
      )}
    >
      {children}
    </section>
  );
}

function BoardCard({ task, team, active, onSelect, overlay }: { task: any; team: CoResponsable[]; active: boolean; onSelect: (t: any) => void; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, disabled: overlay });
  const checklist = checklistProgress(task);
  const late = isLate(task);
  const due = formatDue(task);
  return (
    <div ref={setNodeRef} className={cn("relative", isDragging && "opacity-40")}>
    <button type="button" onClick={() => onSelect(task)} aria-pressed={active} className="block w-full text-left">
      <Card
        className={cn(
          "gap-2.5 px-3 py-3 shadow-xs transition-all hover:-translate-y-px hover:shadow-sm",
          active && "ring-2 ring-primary",
          overlay && "rotate-2 shadow-lg ring-2 ring-primary"
        )}
      >
        <div className="flex items-start gap-2">
          <span aria-hidden="true" className="size-4 shrink-0" />
          <p className="flex-1 text-sm font-medium leading-snug">{task.titulo}</p>
          {task.timerStartedAt && <Timer className="mt-0.5 size-3.5 animate-pulse text-secondary" aria-label="Cronómetro en marcha" />}
        </div>

        {task.isChecklist && checklist.total > 0 && (
          <div className="flex items-center gap-2">
            <ListChecks className="size-3.5 text-success" aria-hidden="true" />
            <Progress value={checklist.pct} className="h-1 flex-1" />
            <span className="text-xs text-muted-foreground tabular-nums">{checklist.done}/{checklist.total}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {late ? (
            <Badge variant="destructive" className="h-5 tabular-nums">Atrasada · {due}</Badge>
          ) : (
            <>
              {due && <span className="text-muted-foreground tabular-nums">{due}</span>}
              {isUrgent(task) && <Badge variant="secondary" className="h-5">Urgente</Badge>}
            </>
          )}
          {task.generaPuntosYRecompensa && <span className="font-medium text-secondary">{pointsLabel(task)}</span>}
          {team.length > 0 && (
            <AvatarGroup className="ml-auto">
              {team.slice(0, 3).map((u) => (
                <Avatar key={u.id} user={u} size="xs" />
              ))}
              {team.length > 3 && <AvatarGroupCount className="size-5 text-[10px]">+{team.length - 3}</AvatarGroupCount>}
            </AvatarGroup>
          )}
        </div>
      </Card>
    </button>
    {!overlay && (
      <span
        {...attributes}
        {...listeners}
        role="button"
        aria-label={`Arrastrar ${task.titulo}`}
        aria-roledescription="Tarjeta arrastrable"
        className="absolute left-1.5 top-3 flex size-5 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </span>
    )}
    </div>
  );
}
