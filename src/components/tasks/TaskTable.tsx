"use client";

import { Camera, ListChecks, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { normalizarRotacionConfig } from "@/lib/rotacionTarea";
import { fotoPruebaPendiente } from "@/lib/tareas/fotoPrueba";
import { StatusBadge } from "./primitives";
import { checklistProgress, formatDue, formatDuration, isLate, isUrgent, pointsLabel, statusInfo } from "./taskUtils";

// Lista central del App Shell 4: tabla en escritorio, filas compactas en móvil.
export function TaskTable({ tasks, selectedId, onSelect }: { tasks: any[]; selectedId: number | null; onSelect: (t: any) => void }) {
  return (
    <>
      <Table className="hidden sm:table">
        <TableCaption className="sr-only">Lista de tareas</TableCaption>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Tarea</TableHead>
            <TableHead className="hidden xl:table-cell">Tiempo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Vence</TableHead>
            <TableHead className="pr-4 text-right">Puntos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const status = statusInfo(task);
            const checklist = checklistProgress(task);
            const esRotativa = Boolean(normalizarRotacionConfig(task.rotacionConfig));
            return (
              <TableRow
                key={task.id}
                data-state={task.id === selectedId ? "selected" : undefined}
                onClick={() => onSelect(task)}
                className="cursor-pointer"
              >
                <TableCell className="w-full max-w-0 py-3 pl-4">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelect(task); }}
                    className="block w-full truncate text-left font-medium focus-visible:outline-none"
                  >
                    {task.titulo}
                  </button>
                  {(esRotativa || (task.isChecklist && checklist.total > 0) || task.requiereFotoPrueba) && (
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                      {esRotativa && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Repeat className="size-3" /> Turno rotativo
                        </span>
                      )}
                      {task.isChecklist && checklist.total > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <ListChecks className="size-3" /> {checklist.done}/{checklist.total}
                        </span>
                      )}
                      {task.requiereFotoPrueba && (
                        <span className={cn("inline-flex items-center gap-1", fotoPruebaPendiente(task) && "text-[var(--warning)]")}>
                          <Camera className="size-3" /> {fotoPruebaPendiente(task) ? "Falta foto" : "Foto"}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDuration(task.tiempoEjecucionEstimadoSeg || 0)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge label={status.label} color={status.color} />
                    {isUrgent(task) && !isLate(task) && <Badge variant="secondary" className="h-5">Urgente</Badge>}
                  </div>
                </TableCell>
                <TableCell className={cn("tabular-nums", isLate(task) ? "font-medium text-destructive" : "text-muted-foreground")}>
                  {formatDue(task) ?? "—"}
                </TableCell>
                <TableCell className="pr-4 text-right font-medium tabular-nums text-secondary">
                  {task.generaPuntosYRecompensa ? pointsLabel(task) : <span className="font-normal text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ul className="divide-y sm:hidden">
        {tasks.map((task) => {
          const status = statusInfo(task);
          const esRotativa = Boolean(normalizarRotacionConfig(task.rotacionConfig));
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onSelect(task)}
                className={cn("w-full px-4 py-3 text-left active:bg-muted", task.id === selectedId && "bg-muted")}
              >
                <p className="font-medium">{task.titulo}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <StatusBadge label={status.label} color={status.color} />
                  {esRotativa && (
                    <span className="inline-flex items-center gap-1 text-primary font-medium">
                      <Repeat className="size-3" /> Turno rotativo
                    </span>
                  )}
                  {isUrgent(task) && !isLate(task) && <Badge variant="secondary" className="h-5">Urgente</Badge>}
                  {task.requiereFotoPrueba && (
                    <span className={cn("inline-flex items-center gap-1", fotoPruebaPendiente(task) && "font-medium text-[var(--warning)]")}>
                      <Camera className="size-3" /> {fotoPruebaPendiente(task) ? "Falta foto" : "Foto"}
                    </span>
                  )}
                  <span className={cn("tabular-nums", isLate(task) && "font-medium text-destructive")}>{formatDue(task) ?? "Sin fecha"}</span>
                  {task.generaPuntosYRecompensa && <span className="font-medium text-secondary tabular-nums">{pointsLabel(task)}</span>}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
