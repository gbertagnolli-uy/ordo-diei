import { DIFICULTADES, type Dificultad } from "../../../../lib/recompensaTarea.ts";
import { determinarTipoTarea, type TipoTareaFiltro, type RecompensaFiltro } from "../../../../lib/proyeccionCalendario.ts";

export type FiltroChecklist = "todas" | "con" | "sin";
export type FiltroRecurrencia = "todas" | "recurrente" | "unica";
export type FiltroTipoTarea = TipoTareaFiltro;
export type FiltroRecompensa = RecompensaFiltro;
export type OrdenTareas = "vencimiento_asc" | "vencimiento_desc" | "tiempo_asc" | "tiempo_desc";

export interface FiltrosAdminTareas {
  personaId?: number | null;
  dificultad?: Dificultad | "todas";
  checklist?: FiltroChecklist;
  recurrencia?: FiltroRecurrencia;
  tipoTarea?: FiltroTipoTarea;
  recompensa?: FiltroRecompensa;
  busqueda?: string;
  orden?: OrdenTareas;
}

const ORDEN_DIFICULTAD: Record<string, number> = Object.fromEntries(DIFICULTADES.map((d, i) => [d, i]));

/** Agrupa tareas por `grupoTareaId` para la vista de lista/tabla, conservando asignados y filas del grupo. */
export function groupTasksForTable(tasks: any[]) {
  const grouped: any[] = [];
  const seenGroups = new Set<string>();

  for (const t of tasks) {
    if (t.grupoTareaId) {
      if (seenGroups.has(t.grupoTareaId)) continue;
      seenGroups.add(t.grupoTareaId);
      const groupTasks = tasks.filter((gt) => gt.grupoTareaId === t.grupoTareaId);
      const assignees = groupTasks.map((gt) => gt.asignado).filter(Boolean);
      grouped.push({
        ...t,
        _isGrouped: true,
        _groupTasks: groupTasks,
        _assignees: assignees,
      });
    } else {
      grouped.push({
        ...t,
        _isGrouped: false,
        _groupTasks: [t],
        _assignees: [t.asignado].filter(Boolean),
      });
    }
  }
  return grouped;
}

/** Filtra y ordena una lista de tareas (agrupadas o individuales) según los criterios de administración. */
export function filtrarYOrdenarTareas<T extends Record<string, any>>(items: T[], filtros: FiltrosAdminTareas): T[] {
  const {
    personaId = null,
    dificultad = "todas",
    checklist = "todas",
    recurrencia = "todas",
    tipoTarea = "todas",
    recompensa = "todas",
    busqueda = "",
    orden = "vencimiento_asc",
  } = filtros;

  const q = busqueda.trim().toLowerCase();

  const filtradas = items.filter((t) => {
    if (personaId !== null && personaId !== undefined) {
      const assignees: any[] = Array.isArray(t._assignees) ? t._assignees : t.asignado ? [t.asignado] : [];
      const baseIds = assignees.length > 0 ? assignees.map((a) => Number(a.id)) : [Number(t.asignadoId)];
      const rotIds = Array.isArray(t.rotacionConfig?.responsablesIds)
        ? t.rotacionConfig.responsablesIds.map((id: any) => Number(id))
        : [];
      const ids = [...new Set([...baseIds, ...rotIds])];
      if (!ids.includes(Number(personaId))) return false;
    }

    if (dificultad && dificultad !== "todas") {
      if ((t.dificultad ?? "Media") !== dificultad) return false;
    }

    // Filtro por tipo de tarea (rotativa, grupal, individual)
    if (tipoTarea && tipoTarea !== "todas") {
      const esRotativa = Boolean(t.rotacionConfig);
      const esGrupal = Boolean(
        t.grupoTareaId ||
        t._isGrouped ||
        (Array.isArray(t._assignees) && t._assignees.length > 1) ||
        (Array.isArray(t._groupTasks) && t._groupTasks.length > 1)
      );
      if (tipoTarea === "rotativa" && !esRotativa) return false;
      if (tipoTarea === "grupal" && !esGrupal) return false;
      if (tipoTarea === "individual" && (esRotativa || esGrupal)) return false;
    }

    // Filtro por si genera recompensas o no
    if (recompensa && recompensa !== "todas") {
      const genera = Boolean(t.generaPuntosYRecompensa);
      if (recompensa === "con_recompensa" && !genera) return false;
      if (recompensa === "sin_recompensa" && genera) return false;
    }

    const tieneChecklist = Boolean(t.isChecklist) || (Array.isArray(t.checklistItems) && t.checklistItems.length > 0);
    if (checklist === "con" && !tieneChecklist) return false;
    if (checklist === "sin" && tieneChecklist) return false;

    const esRecurrente = Boolean(
      (t.tipoRecurrencia && t.tipoRecurrencia !== "Unica") ||
      t.rotacionConfig ||
      t.parentTaskId
    );
    if (recurrencia === "recurrente" && !esRecurrente) return false;
    if (recurrencia === "unica" && esRecurrente) return false;

    if (q) {
      const texto = `${t.titulo ?? ""} ${t.descripcion ?? ""}`.toLowerCase();
      if (!texto.includes(q)) return false;
    }

    return true;
  });

  const tsDe = (t: any): number | null => {
    const raw = t.horaEjecucion || t.fechaVencimiento;
    if (!raw) return null;
    const ms = new Date(raw).getTime();
    return Number.isFinite(ms) ? ms : null;
  };

  return [...filtradas].sort((a, b) => {
    if (orden === "tiempo_asc" || orden === "tiempo_desc") {
      const ta = Number(a.tiempoEjecucionEstimadoSeg ?? 0);
      const tb = Number(b.tiempoEjecucionEstimadoSeg ?? 0);
      if (ta !== tb) return orden === "tiempo_asc" ? ta - tb : tb - ta;
    } else {
      const fa = tsDe(a);
      const fb = tsDe(b);
      if (fa === null && fb !== null) return 1;
      if (fa !== null && fb === null) return -1;
      if (fa !== null && fb !== null && fa !== fb) {
        return orden === "vencimiento_asc" ? fa - fb : fb - fa;
      }
    }
    const da = ORDEN_DIFICULTAD[a.dificultad ?? "Media"] ?? 3;
    const db = ORDEN_DIFICULTAD[b.dificultad ?? "Media"] ?? 3;
    if (da !== db) return db - da;
    return Number(a.id ?? 0) - Number(b.id ?? 0);
  });
}
