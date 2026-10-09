"use client";

import { ListChecks, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "./primitives";
import {
  CoResponsableMap,
  TaskGroup,
  GROUP_LABEL,
  checklistProgress,
  formatDue,
  isLate,
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

// Réplica de React Bits Pro "Kanban 4": tablero por estado; el detalle se abre en el panel del shell.
export function TaskBoard({
  tasks,
  coResponsables,
  selectedId,
  onSelect,
}: {
  tasks: any[];
  coResponsables: CoResponsableMap;
  selectedId: number | null;
  onSelect: (task: any) => void;
}) {
  return (
    <div className="h-full overflow-x-auto">
      <div className="flex h-full gap-3 px-4 sm:px-5 pb-4">
        {COLUMNS.map((col) => {
          const all = sortTasks(tasks.filter((t) => taskGroup(t) === col.id), col.id === "done" ? "done" : null);
          const shown = col.id === "done" ? all.slice(0, DONE_LIMIT) : all;
          return (
            <section key={col.id} aria-label={GROUP_LABEL[col.id]} className="flex-1 min-w-[12rem] max-w-80 flex flex-col rounded-xl bg-[var(--surface-container-low)]">
              <header className="flex items-center gap-2 px-3 h-11 shrink-0">
                <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <h2 className="text-sm font-semibold text-[var(--on-surface)]">{GROUP_LABEL[col.id]}</h2>
                <span className="ml-auto text-xs tabular-nums text-[var(--on-surface-variant)]">{all.length}</span>
              </header>
              <ul className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-2">
                {shown.length === 0 && (
                  <li className="mx-1 rounded-lg border border-dashed border-[color-mix(in-srgb,var(--outline-variant)_60%,transparent)] px-3 py-6 text-center text-xs text-[var(--on-surface-variant)]">
                    Sin tareas
                  </li>
                )}
                {shown.map((task) => (
                  <li key={task.id}>
                    <BoardCard task={task} team={coResponsables[task.id] || []} active={task.id === selectedId} onSelect={onSelect} />
                  </li>
                ))}
                {all.length > shown.length && (
                  <li className="px-2 py-1 text-[11px] text-[var(--on-surface-variant)]">
                    y {all.length - shown.length} más en «Completadas»
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({ task, team, active, onSelect }: { task: any; team: { id: number; nombre: string; fotoUrl: string | null }[]; active: boolean; onSelect: (t: any) => void }) {
  const checklist = checklistProgress(task);
  const late = isLate(task);
  const due = formatDue(task);
  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      aria-pressed={active}
      className={cn(
        "w-full text-left rounded-lg bg-[var(--surface-container-lowest)] p-3 border transition-all",
        active
          ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
          : "border-[color-mix(in-srgb,var(--outline-variant)_35%,transparent)] hover:border-[color-mix(in-srgb,var(--primary)_50%,transparent)] hover:-translate-y-px hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-medium leading-snug text-[var(--on-surface)]">{task.titulo}</p>
        {task.timerStartedAt && <Timer className="w-3.5 h-3.5 mt-0.5 text-[var(--secondary)] animate-pulse" aria-label="Cronómetro en marcha" />}
      </div>

      {task.isChecklist && checklist.total > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <ListChecks className="w-3.5 h-3.5 text-[var(--success)]" aria-hidden="true" />
          <div className="flex-1 h-1 rounded-full bg-[var(--surface-container-high)] overflow-hidden">
            <div className="h-full bg-[var(--success)]" style={{ width: `${checklist.pct}%` }} />
          </div>
          <span className="text-[11px] tabular-nums text-[var(--on-surface-variant)]">{checklist.done}/{checklist.total}</span>
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] whitespace-nowrap">
        {due && <span className={cn("tabular-nums", late ? "text-[var(--error)] font-semibold" : "text-[var(--on-surface-variant)]")}>{late ? `Atrasada ${due}` : due}</span>}
        {task.generaPuntosYRecompensa && <span className="font-semibold text-[var(--secondary)]">{pointsLabel(task)}</span>}
        {team.length > 0 && (
          <span className="ml-auto flex -space-x-1.5">
            {team.slice(0, 3).map((u) => (
              <span key={u.id} title={u.nombre} className="rounded-full ring-2 ring-[var(--surface-container-lowest)]">
                <Avatar user={u} size="xs" />
              </span>
            ))}
            {team.length > 3 && (
              <span className="w-5 h-5 rounded-full ring-2 ring-[var(--surface-container-lowest)] bg-[var(--surface-container-high)] text-[10px] font-semibold text-[var(--on-surface-variant)] inline-flex items-center justify-center">
                +{team.length - 3}
              </span>
            )}
          </span>
        )}
      </div>
    </button>
  );
}
