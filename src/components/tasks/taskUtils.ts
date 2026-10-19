// Agrupación, etiquetas y formato de tareas compartidos por el App Shell y el Kanban.

import { ocurreEn, calcularPrimerVencimientoRecurrente } from "../../lib/recurrenceUtils.ts";
import {
  normalizarRotacionConfig,
  ocurreRotacionEn,
  responsablesEnDia,
  parsearFechaLocal,
  esMismoDiaCalendario,
} from "../../lib/rotacionTarea.ts";

export type TaskGroup = "todo" | "progress" | "review" | "done";

export type CoResponsable = { id: number; nombre: string; fotoUrl: string | null };
export type CoResponsableMap = Record<number, CoResponsable[]>;

const DONE = ["Completada", "Aprobada"];

// Igual que el MyTasksBoard original: pendiente es todo lo que no está completado ni en revisión
// (incluye Vencida, Expirada, No_Realizada, Rechazada). "progress" es solo la parte de
// pendientes con el cronómetro en marcha.
export function taskGroup(task: any): TaskGroup {
  if (DONE.includes(task.estado)) return "done";
  if (task.estado === "Esperando_Aprobacion") return "review";
  if (task.timerStartedAt || task.estado === "En_progreso") return "progress";
  return "todo";
}

// Tareas sobre las que el asignado puede actuar (timer, completar, no realizada)
export function isActionable(task: any) {
  const g = taskGroup(task);
  return g === "todo" || g === "progress";
}

/**
 * Determina si una tarea aplica a un día específico (y a un usuario opcional).
 * Maneja tareas únicas, plantillas recurrentes y rotativas.
 */
export function taskAppliesOnDay(task: any, day: Date, userId?: number): boolean {
  const esPlantillaBase =
    ((task.tipoRecurrencia && task.tipoRecurrencia !== "Unica") || Boolean(task.rotacionConfig)) &&
    !task.parentTaskId &&
    !task.generadaPorCron;

  const config = normalizarRotacionConfig(task.rotacionConfig);

  if (config) {
    if (!ocurreRotacionEn(task, day)) return false;
    const resp = responsablesEnDia(config, day, task.anclaFecha ?? task.fechaVencimiento);
    if (userId !== undefined && userId !== null) {
      return resp.includes(Number(userId));
    }
    return resp.length > 0;
  }

  if (esPlantillaBase && task.tipoRecurrencia && task.tipoRecurrencia !== "Unica") {
    if (userId !== undefined && userId !== null && Number(task.asignadoId) !== Number(userId)) {
      return false;
    }
    return ocurreEn(task, day);
  }

  // Instancia concreta o tarea única
  if (userId !== undefined && userId !== null && Number(task.asignadoId) !== Number(userId)) {
    return false;
  }
  const raw = task.horaEjecucion || task.fechaVencimiento;
  const d = parsearFechaLocal(raw);
  return d ? esMismoDiaCalendario(d, day) : false;
}

/**
 * Obtiene la fecha de vencimiento o próxima asignación efectiva de una tarea.
 * Para plantillas recurrentes o rotativas, calcula la fecha más próxima a partir de `fromDate` (hoy por defecto)
 * para no mostrar la fecha estática de creación.
 */
export function dueDate(task: any, fromDate: Date = new Date()): Date | null {
  const esPlantillaBase =
    ((task.tipoRecurrencia && task.tipoRecurrencia !== "Unica") || Boolean(task.rotacionConfig)) &&
    !task.parentTaskId &&
    !task.generadaPorCron;

  if (esPlantillaBase) {
    const config = normalizarRotacionConfig(task.rotacionConfig);
    const inicio = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());

    if (config) {
      for (let offset = 0; offset <= 366; offset++) {
        const candidato = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + offset);
        if (taskAppliesOnDay(task, candidato, task.asignadoId)) {
          if (task.horaEjecucion) {
            const h = new Date(task.horaEjecucion);
            return new Date(candidato.getFullYear(), candidato.getMonth(), candidato.getDate(), h.getHours(), h.getMinutes(), 0);
          }
          return candidato;
        }
      }
    } else if (task.tipoRecurrencia && task.tipoRecurrencia !== "Unica") {
      let horaStr: string | null = null;
      if (task.horaEjecucion) {
        const h = new Date(task.horaEjecucion);
        horaStr = `${h.getHours()}:${h.getMinutes()}`;
      }
      const prox = calcularPrimerVencimientoRecurrente(task, inicio, horaStr);
      return prox.horaEjecucion ?? prox.fechaVencimiento;
    }
  }

  const raw = task.horaEjecucion || task.fechaVencimiento;
  return raw ? new Date(raw) : null;
}

export function isLate(task: any) {
  const d = dueDate(task);
  return isActionable(task) && !!d && d.getTime() < Date.now();
}

// Regla original de TaskCard: urgente si vence en menos de 2 h o ya venció
export function isUrgent(task: any) {
  const d = dueDate(task);
  return isActionable(task) && !!d && d.getTime() - Date.now() < 2 * 60 * 60 * 1000;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isDueToday(task: any, userId?: number) {
  return isActionable(task) && taskAppliesOnDay(task, new Date(), userId);
}

export const GROUP_LABEL: Record<TaskGroup, string> = {
  todo: "Por hacer",
  progress: "En curso",
  review: "En revisión",
  done: "Completadas",
};

type StatusInfo = { label: string; color: string };

export function statusInfo(task: any): StatusInfo {
  const g = taskGroup(task);
  if (g === "todo" && isLate(task)) return { label: "Atrasada", color: "var(--error)" };
  if (g === "todo" && task.estado === "Rechazada") return { label: "Rehacer", color: "var(--error)" };
  if (g === "todo" && task.estado === "Pausada") return { label: "Pausada", color: "var(--secondary)" };
  if (g === "todo" && task.estado === "Expirada") return { label: "Expirada", color: "var(--error)" };
  if (g === "todo" && task.estado === "No_Realizada") return { label: "No realizada", color: "var(--error)" };
  switch (g) {
    case "todo": return { label: "Pendiente", color: "var(--on-surface-variant)" };
    case "progress": return { label: "En curso", color: "var(--secondary)" };
    case "review": return { label: "En revisión", color: "var(--primary)" };
    case "done": return { label: task.estado === "Aprobada" ? "Aprobada" : "Completada", color: "var(--success)" };
  }
}

export function sortTasks(tasks: any[], group: TaskGroup | null) {
  const copy = [...tasks];
  if (group === "done") {
    return copy.sort((a, b) => (dueDate(b)?.getTime() ?? 0) - (dueDate(a)?.getTime() ?? 0));
  }
  // Orden por fecha efectiva de vencimiento/asignación
  return copy.sort((a, b) => {
    const da = dueDate(a);
    const db = dueDate(b);
    if (da && !db) return -1;
    if (!da && db) return 1;
    if (da && db) {
      const diff = da.getTime() - db.getTime();
      if (diff !== 0) return diff;
    }
    if (a.horaEjecucion && !b.horaEjecucion) return -1;
    if (!a.horaEjecucion && b.horaEjecucion) return 1;
    return 0;
  });
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });

export function formatDue(task: any, withTime = false, onDay?: Date) {
  const d = onDay ?? dueDate(task);
  if (!d) return null;
  const day = isSameDay(d, new Date()) ? "Hoy" : dateFmt.format(d);
  if (withTime && task.horaEjecucion) {
    const h = new Date(task.horaEjecucion);
    return `${day}, ${timeFmt.format(h)}`;
  }
  return day;
}

export function formatDuration(secs: number) {
  const m = Math.round(secs / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function formatClock(secs: number) {
  const abs = Math.abs(secs);
  const m = Math.floor(abs / 60), s = abs % 60;
  return `${secs < 0 ? "-" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Los puntos se calculan al completar; antes solo se sabe que la tarea suma
export function pointsLabel(task: any) {
  return task.puntosGenerados ? `+${task.puntosGenerados}` : "⭐ Suma";
}

export function checklistProgress(task: any) {
  const items = task.checklistItems || [];
  const done = items.filter((ci: any) => ci.completado).length;
  return { total: items.length, done, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
}
