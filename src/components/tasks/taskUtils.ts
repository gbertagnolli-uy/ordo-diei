// Agrupación, etiquetas y formato de tareas compartidos por el App Shell y el Kanban.

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

export function dueDate(task: any): Date | null {
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

export function isDueToday(task: any) {
  const d = dueDate(task);
  return isActionable(task) && !!d && isSameDay(d, new Date());
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
  // Orden original: primero las que tienen hora, luego las que tienen fecha, luego el resto
  return copy.sort((a, b) => {
    if (a.horaEjecucion && !b.horaEjecucion) return -1;
    if (!a.horaEjecucion && b.horaEjecucion) return 1;
    if (a.horaEjecucion && b.horaEjecucion) return new Date(a.horaEjecucion).getTime() - new Date(b.horaEjecucion).getTime();
    if (a.fechaVencimiento && !b.fechaVencimiento) return -1;
    if (!a.fechaVencimiento && b.fechaVencimiento) return 1;
    if (a.fechaVencimiento && b.fechaVencimiento) return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
    return 0;
  });
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });

export function formatDue(task: any, withTime = false) {
  const d = dueDate(task);
  if (!d) return null;
  const day = isSameDay(d, new Date()) ? "Hoy" : dateFmt.format(d);
  return withTime && task.horaEjecucion ? `${day}, ${timeFmt.format(d)}` : day;
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
