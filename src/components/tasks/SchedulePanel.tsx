"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { dueDate, formatDue, isActionable, isSameDay, sortTasks, statusInfo } from "./taskUtils";

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const monthFmt = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
const dayLabelFmt = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// Panel "Agenda" del App Shell 4: calendario del mes con marcas en los días con vencimientos + lista.
export function SchedulePanel({
  tasks,
  onSelect,
  onClose,
}: {
  tasks: any[];
  onSelect: (task: any) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const scheduled = useMemo(() => tasks.filter((t) => dueDate(t)), [tasks]);

  // Semanas de lunes a domingo que cubren el mes visible
  const weeks = useMemo(() => {
    const start = new Date(month);
    start.setDate(1 - ((month.getDay() + 6) % 7));
    const rows: Date[][] = [];
    const cursor = new Date(start);
    while (rows.length < 6) {
      const row: Date[] = [];
      for (let i = 0; i < 7; i++) {
        row.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      rows.push(row);
      if (cursor.getMonth() !== month.getMonth() && rows.length >= 4) break;
    }
    return rows;
  }, [month]);

  const hasTasks = (day: Date) => scheduled.some((t) => isSameDay(dueDate(t)!, day));

  const list = selectedDay
    ? sortTasks(scheduled.filter((t) => isSameDay(dueDate(t)!, selectedDay)), null)
    : sortTasks(tasks.filter(isActionable), null);

  const shiftMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 h-14 border-b border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)] shrink-0">
        <h2 className="font-display text-base text-[var(--on-surface)]">Agenda</h2>
        <button type="button" onClick={onClose} aria-label="Ocultar agenda" className="p-1.5 rounded-md text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] transition-colors">
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pt-4 shrink-0">
        <div className="flex items-center gap-1 mb-2">
          <p className="flex-1 pl-1 text-sm font-semibold first-letter:uppercase text-[var(--on-surface)]">{monthFmt.format(month)}</p>
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Mes anterior" className="p-1.5 rounded-md text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Mes siguiente" className="p-1.5 rounded-md text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <table className="w-full table-fixed text-center">
          <caption className="sr-only">Vencimientos de {monthFmt.format(month)}</caption>
          <thead>
            <tr>
              {WEEKDAYS.map((d) => (
                <th key={d} scope="col" className="pb-1 text-[11px] font-medium text-[var(--on-surface-variant)]">
                  <span aria-hidden="true">{d.charAt(0)}</span>
                  <span className="sr-only">{d}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, i) => (
              <tr key={i}>
                {week.map((day) => {
                  const outside = day.getMonth() !== month.getMonth();
                  const isToday = isSameDay(day, today);
                  const selected = !!selectedDay && isSameDay(day, selectedDay);
                  return (
                    <td key={day.toISOString()} className="p-0.5">
                      <button
                        type="button"
                        aria-label={dayLabelFmt.format(day)}
                        aria-pressed={selected}
                        aria-current={isToday ? "date" : undefined}
                        onClick={() => setSelectedDay(selected ? null : day)}
                        className={cn(
                          "relative w-full aspect-square rounded-md text-xs tabular-nums transition-colors",
                          outside ? "text-[color-mix(in-srgb,var(--on-surface-variant)_45%,transparent)]" : "text-[var(--on-surface)]",
                          selected
                            ? "bg-[var(--primary)] text-[var(--on-primary)]"
                            : isToday
                              ? "font-bold text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]"
                              : "hover:bg-[var(--surface-container)]"
                        )}
                      >
                        {hasTasks(day) && (
                          <span
                            aria-hidden="true"
                            className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full", selected ? "bg-[var(--on-primary)]" : "bg-[var(--secondary)]")}
                          />
                        )}
                        {day.getDate()}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="px-5 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] shrink-0">
        {selectedDay ? dayLabelFmt.format(selectedDay) : "Pendientes"}
      </p>
      <div className="relative flex-1 min-h-0">
        <ul className="h-full overflow-y-auto px-3 pb-4 space-y-0.5">
          {list.length === 0 && (
            <li className="px-2 py-3 text-sm text-[var(--on-surface-variant)]">
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
                  className="w-full grid grid-cols-[auto_1fr] gap-x-2.5 items-baseline text-left px-2 py-2 rounded-lg hover:bg-[var(--surface-container)] transition-colors"
                >
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full translate-y-[-1px]" style={{ background: status.color }} />
                  <span className="text-[11px] tabular-nums text-[var(--on-surface-variant)]">{formatDue(task, true) ?? "Sin fecha"}</span>
                  <span />
                  <span className="text-sm font-medium text-[var(--on-surface)] truncate">{task.titulo}</span>
                  <span />
                  <span className="text-[11px] text-[var(--on-surface-variant)]">{status.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[var(--surface-container-lowest)]" />
      </div>
    </div>
  );
}
