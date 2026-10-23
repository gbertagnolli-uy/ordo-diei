export interface AgendaUser {
  id: number;
  nombre: string;
  rolFamiliar: string;
  fotoUrl: string | null;
  puestoRanking?: number | null;
  emojiPodio?: string | null;
}

export interface AgendaTaskItem {
  id: string | number;
  title: string;
  descripcion?: string | null;
  estado: string;
  dificultad?: string;
  puntosGenerados?: number;
  tiempoEstimadoSeg?: number;
  horaEjecucion?: string | null;
  start?: string | null;
  checklistItems?: { id: number; titulo: string; completado: boolean; orden: number }[];
  asignados: AgendaUser[];
  tipoTareaCalculado?: "individual" | "rotativa" | "grupal";
}

export interface AgendaStats {
  total: number;
  completadas: number;
  enRevision: number;
  enProgreso: number;
  pendientes: number;
  pct: number;
}

export function calcularEstadisticasAgenda(tasks: AgendaTaskItem[]): AgendaStats {
  const total = tasks.length;
  const completadas = tasks.filter(
    (t) => t.estado === "Completada" || t.estado === "Aprobada"
  ).length;
  const enRevision = tasks.filter((t) => t.estado === "Esperando_Aprobacion").length;
  const enProgreso = tasks.filter((t) => t.estado === "En_progreso").length;
  const pendientes = tasks.filter((t) => t.estado === "Pendiente" || t.estado === "Vencida").length;
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;

  return { total, completadas, enRevision, enProgreso, pendientes, pct };
}

export function filtrarTareasAgenda(
  tasks: AgendaTaskItem[],
  filtros: {
    userId?: number | null;
    estado?: string;
    busqueda?: string;
  }
): AgendaTaskItem[] {
  const { userId, estado = "todas", busqueda = "" } = filtros;
  const q = busqueda.trim().toLowerCase();

  return tasks.filter((t) => {
    // Filtro por usuario
    if (userId !== undefined && userId !== null) {
      const estaAsignado = t.asignados.some((a) => a.id === userId);
      if (!estaAsignado) return false;
    }

    // Filtro por estado
    if (estado === "pendientes") {
      if (t.estado === "Completada" || t.estado === "Aprobada") return false;
    } else if (estado === "en_revision") {
      if (t.estado !== "Esperando_Aprobacion") return false;
    } else if (estado === "completadas") {
      if (t.estado !== "Completada" && t.estado !== "Aprobada") return false;
    }

    // Filtro por búsqueda
    if (q) {
      const coincideTitulo = t.title.toLowerCase().includes(q);
      const coincideDesc = Boolean(t.descripcion?.toLowerCase().includes(q));
      if (!coincideTitulo && !coincideDesc) return false;
    }

    return true;
  });
}

export function agruparTareasPorMiembro(
  users: AgendaUser[],
  tasks: AgendaTaskItem[],
  selectedUserId?: number | null
): { usuario: AgendaUser; tareas: AgendaTaskItem[] }[] {
  if (selectedUserId !== undefined && selectedUserId !== null) {
    const u = users.find((x) => x.id === selectedUserId);
    if (!u) return [];
    return [
      {
        usuario: u,
        tareas: tasks.filter((t) => t.asignados.some((a) => a.id === u.id)),
      },
    ];
  }

  return users
    .map((u) => ({
      usuario: u,
      tareas: tasks.filter((t) => t.asignados.some((a) => a.id === u.id)),
    }))
    .filter((g) => g.tareas.length > 0 || users.length <= 4);
}
