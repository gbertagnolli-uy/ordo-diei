// Agrupación, etiquetas y formato de tareas compartidos por el App Shell y el Kanban.

export type TaskGroup = "todo" | "progress" | "review" | "done" | "archived";

export type CoResponsable = { id: number; nombre: string; fotoUrl: string | null };
export type CoResponsableMap = Record<number, CoResponsable[]>;

const DONE = ["Completada", "Aprobada"];
const ARCHIVED = ["Expirada", "No_Realizada"];

export function taskGroup(task: any): TaskGroup {
  if (DONE.includes(task.estado)) return "done";
  if (task.estado === "Esperando_Aprobacion") return "review";
  if (ARCHIVED.includes(task.estado)) return "archived";
  if (task.timerStartedAt || task.estado === "En_progreso") return "progress";
  return "todo";
}

// Tareas sobre las que el asignado todavía puede actuar (timer, completar, no realizada)
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
  archived: "No realizadas",
};

type StatusInfo = { label: string; color: string };

export function statusInfo(task: any): StatusInfo {
  const g = taskGroup(task);
  if (g === "todo" && isLate(task)) return { label: "Atrasada", color: "var(--error)" };
  if (g === "todo" && task.estado === "Rechazada") return { label: "Rehacer", color: "var(--error)" };
  if (g === "todo" && task.estado === "Pausada") return { label: "Pausada", color: "var(--secondary)" };
  switch (g) {
    case "todo": return { label: "Pendiente", color: "var(--on-surface-variant)" };
    case "progress": return { label: "En curso", color: "var(--secondary)" };
    case "review": return { label: "En revisión", color: "var(--primary)" };
    case "done": return { label: task.estado === "Aprobada" ? "Aprobada" : "Completada", color: "var(--success)" };
    case "archived": return { label: "No realizada", color: "var(--outline)" };
  }
}

export function sortTasks(tasks: any[], group: TaskGroup | null) {
  const copy = [...tasks];
  if (group === "done" || group === "archived") {
    return copy.sort((a, b) => (dueDate(b)?.getTime() ?? 0) - (dueDate(a)?.getTime() ?? 0));
  }
  // Primero las que tienen fecha, de la más próxima a la más lejana
  return copy.sort((a, b) => {
    const da = dueDate(a), db = dueDate(b);
    if (da && !db) return -1;
    if (!da && db) return 1;
    if (da && db) return da.getTime() - db.getTime();
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
