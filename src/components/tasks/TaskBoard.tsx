"use client";

import { ListChecks, Timer } from "lucide-react";
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

// Réplica de React Bits Pro "Kanban 4": tablero por estado; el detalle se abre en el panel de contexto.
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
      <div className="flex h-full gap-3 px-4 pb-4">
        {COLUMNS.map((col) => {
          const all = sortTasks(tasks.filter((t) => taskGroup(t) === col.id), col.id === "done" ? "done" : null);
          const shown = col.id === "done" ? all.slice(0, DONE_LIMIT) : all;
          return (
            <section key={col.id} aria-label={GROUP_LABEL[col.id]} className="flex min-w-[11.5rem] max-w-80 flex-1 flex-col rounded-xl bg-muted/60">
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
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({ task, team, active, onSelect }: { task: any; team: CoResponsable[]; active: boolean; onSelect: (t: any) => void }) {
  const checklist = checklistProgress(task);
  const late = isLate(task);
  const due = formatDue(task);
  return (
    <button type="button" onClick={() => onSelect(task)} aria-pressed={active} className="block w-full text-left">
      <Card
        className={cn(
          "gap-2.5 px-3 py-3 shadow-xs transition-all hover:-translate-y-px hover:shadow-sm",
          active && "ring-2 ring-primary"
        )}
      >
        <div className="flex items-start gap-2">
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
  );
}
