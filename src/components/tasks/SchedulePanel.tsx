"use client";

import { useMemo, useState } from "react";
import { PanelRightClose } from "lucide-react";
import { es } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { dueDate, formatDue, isActionable, sortTasks, statusInfo, taskAppliesOnDay } from "./taskUtils";

const dayLabelFmt = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" });

// Panel "Agenda" del App Shell 4: calendario con marca en los días con vencimientos + lista.
export function SchedulePanel({
  tasks,
  onSelect,
  onClose,
  currentUserId,
}: {
  tasks: any[];
  onSelect: (task: any) => void;
  onClose: () => void;
  currentUserId?: number;
}) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [month, setMonth] = useState<Date>(new Date());

  // Días con tareas efectivas para el período visible del calendario
  const dueDays = useMemo(() => {
    const days: Date[] = [];
    const base = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 2, 0);

    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000);
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if (tasks.some((t) => taskAppliesOnDay(t, d, currentUserId))) {
        days.push(d);
      }
    }
    return days;
  }, [tasks, month, currentUserId]);

  const list = selectedDay
    ? sortTasks(tasks.filter((t) => taskAppliesOnDay(t, selectedDay, currentUserId)), null)
    : sortTasks(tasks.filter(isActionable), null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        <h2 className="text-sm font-semibold">Agenda</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Ocultar agenda">
          <PanelRightClose />
        </Button>
      </div>
      <Separator />

      <Calendar
        mode="single"
        locale={es}
        month={month}
        onMonthChange={setMonth}
        selected={selectedDay}
        onSelect={setSelectedDay}
        modifiers={{ due: dueDays }}
        modifiersClassNames={{
          due: "relative after:absolute after:bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-secondary",
        }}
        className="mx-auto w-full bg-transparent px-3 pt-3 [--cell-size:--spacing(9)]"
        classNames={{ root: "w-full", caption_label: "text-sm font-medium capitalize" }}
      />

      <Separator className="mt-2" />
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <p className="text-xs font-medium first-letter:uppercase text-muted-foreground">
          {selectedDay ? dayLabelFmt.format(selectedDay) : "Pendientes"}
        </p>
        {selectedDay && (
          <Button variant="link" size="xs" className="h-auto px-0 text-xs" onClick={() => setSelectedDay(undefined)}>
            Ver pendientes
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="space-y-0.5 px-2 pb-4">
          {list.length === 0 && (
            <li className="px-2 py-3 text-sm text-muted-foreground">
              {selectedDay ? "Nada vence este día." : "No tienes tareas pendientes."}
            </li>
          )}
          {list.map((task) => {
            const status = statusInfo(task);
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onSelect(task)}
                  className="flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
                >
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: status.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{task.titulo}</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {formatDue(task, true, selectedDay) ?? "Sin fecha"} · {status.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
