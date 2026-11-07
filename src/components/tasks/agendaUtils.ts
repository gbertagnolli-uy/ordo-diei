// Qué tareas muestra el panel Agenda (lane 262, Plane #19).
import { isActionable, statusInfo, taskAppliesOnDay } from "./taskUtils.ts";

/** Lo mínimo que estas funciones leen de una tarea. */
export type TareaAgenda = {
  id: number;
  tipoRecurrencia?: string | null;
  rotacionConfig?: unknown;
  parentTaskId?: number | null;
  generadaPorCron?: boolean | null;
};

/** Plantilla de una tarea recurrente o rotativa: la regla, no la tarea de un día concreto. */
export function esPlantillaBase(task: TareaAgenda): boolean {
  return (
    ((Boolean(task.tipoRecurrencia) && task.tipoRecurrencia !== "Unica") || Boolean(task.rotacionConfig)) &&
    !task.parentTaskId &&
    !task.generadaPorCron
  );
}

/**
 * Lista de la Agenda.
 * - Sin día: las tareas accionables, sin plantillas (se hace la instancia del día, no la regla).
 * - Con día: las que aplican ese día; si la instancia de una plantilla ya existe ese día, la plantilla se oculta.
 */
export function tareasDeAgenda<T extends TareaAgenda>(tasks: T[], dia: Date | undefined, userId?: number): T[] {
  if (!dia) return tasks.filter((t) => isActionable(t) && !esPlantillaBase(t));
  const delDia = tasks.filter((t) => taskAppliesOnDay(t, dia, userId));
  const conInstancia = new Set(delDia.filter((t) => t.parentTaskId).map((t) => Number(t.parentTaskId)));
  return delDia.filter((t) => !(esPlantillaBase(t) && conInstancia.has(Number(t.id))));
}

/** Estado que muestra la Agenda: una plantilla figura «Programada», no con el estado de su última vez. */
export function estadoEnAgenda(task: TareaAgenda): { label: string; color: string } {
  if (esPlantillaBase(task)) return { label: "Programada", color: "var(--on-surface-variant)" };
  return statusInfo(task);
}
