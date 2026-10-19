import { ocurreEn } from "./recurrenceUtils.ts";
import {
  normalizarRotacionConfig,
  ocurreRotacionEn,
  parsearFechaLocal,
  responsablesEnDia,
} from "./rotacionTarea.ts";
import type { Dificultad } from "./recompensaTarea.ts";

export type TipoTareaFiltro = "todas" | "rotativa" | "grupal" | "individual";
export type RecurrenciaFiltro = "todas" | "recurrente" | "unica";
export type RecompensaFiltro = "todas" | "con_recompensa" | "sin_recompensa";

export interface FiltrosCalendario {
  usuarioId?: number | null;
  dificultad?: Dificultad | "todas";
  tipoTarea?: TipoTareaFiltro;
  recurrencia?: RecurrenciaFiltro;
  recompensa?: RecompensaFiltro;
  busqueda?: string;
}

export interface EventoCalendarioProyectado {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: any;
}

export interface UsuarioBasico {
  id: number;
  nombre: string;
  rolFamiliar?: string;
  fotoUrl?: string | null;
}

/**
 * Normaliza una fecha a inicio de día (00:00:00.000 local).
 */
export function inicioDeDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Determina el tipo de tarea: "rotativa", "grupal" o "individual".
 */
export function determinarTipoTarea(t: {
  rotacionConfig?: unknown;
  grupoTareaId?: string | null;
  _isGrouped?: boolean;
  _assignees?: any[];
  [key: string]: any;
}): "rotativa" | "grupal" | "individual" {
  if (t.rotacionConfig && normalizarRotacionConfig(t.rotacionConfig) !== null) {
    return "rotativa";
  }
  if (t.grupoTareaId || t._isGrouped || (Array.isArray(t._assignees) && t._assignees.length > 1)) {
    return "grupal";
  }
  return "individual";
}

/**
 * Proyecta tareas existentes y recurrentes/rotativas sobre un rango de fechas de calendario,
 * asignando cada tarea al día y usuario correspondiente y aplicando filtros exhaustivos.
 */
export function proyectarEventosCalendario(
  tasks: any[],
  users: UsuarioBasico[],
  rangoInicio: Date,
  rangoFin: Date,
  filtros: FiltrosCalendario = {}
): EventoCalendarioProyectado[] {
  const userMap = new Map<number, UsuarioBasico>();
  for (const u of users) {
    userMap.set(Number(u.id), u);
  }

  const inicioRango = inicioDeDia(rangoInicio);
  const finRango = inicioDeDia(rangoFin);
  const finRangoFinDelDia = new Date(finRango.getFullYear(), finRango.getMonth(), finRango.getDate(), 23, 59, 59, 999);

  // Mapa de instancias concretas que ya existen en la base por fecha y usuario
  // clave: `${tareaBaseId}-${usuarioId}-${YYYY-MM-DD}`
  const instanciasExistentes = new Set<string>();

  for (const t of tasks) {
    const fv = parsearFechaLocal(t.fechaVencimiento ?? t.horaEjecucion);
    if (!fv) continue;
    const ymd = `${fv.getFullYear()}-${String(fv.getMonth() + 1).padStart(2, "0")}-${String(fv.getDate()).padStart(2, "0")}`;
    const baseId = t.parentTaskId ?? t.id;
    instanciasExistentes.add(`${baseId}-${t.asignadoId}-${ymd}`);
  }

  const eventos: EventoCalendarioProyectado[] = [];

  // 1. Instancias concretas ya guardadas en base
  for (const t of tasks) {
    const fv = parsearFechaLocal(t.fechaVencimiento ?? t.horaEjecucion);
    if (!fv) continue;
    if (fv < inicioRango || fv > finRangoFinDelDia) continue;

    let start = new Date(fv);
    let end = new Date(start);
    let allDay = true;

    if (t.horaEjecucion) {
      const orig = new Date(t.horaEjecucion);
      start = new Date(fv.getFullYear(), fv.getMonth(), fv.getDate(), orig.getHours(), orig.getMinutes(), 0);
      const duracionSeg = Number(t.tiempoEjecucionEstimadoSeg) || 1800;
      end = new Date(start.getTime() + duracionSeg * 1000);
      allDay = false;
    }

    const u = userMap.get(Number(t.asignadoId)) ?? t.asignado ?? {
      id: t.asignadoId,
      nombre: `Usuario ${t.asignadoId}`,
      rolFamiliar: "Hijo",
      fotoUrl: null,
    };

    const rot = normalizarRotacionConfig(t.rotacionConfig);
    const resp = rot ? responsablesEnDia(rot, fv, t.anclaFecha ?? t.fechaVencimiento) : [];
    const esGrupalEnDia = Boolean(
      t.grupoTareaId ||
      t._isGrouped ||
      (Array.isArray(t._assignees) && t._assignees.length > 1) ||
      resp.length > 1
    );

    const tipo = esGrupalEnDia ? "grupal" : determinarTipoTarea(t);
    const resource = {
      ...t,
      asignado: u,
      tipoTareaCalculado: tipo,
      esGrupal: esGrupalEnDia,
      esProyectada: false,
    };

    eventos.push({
      id: t.id,
      title: t.titulo,
      start,
      end,
      allDay,
      resource,
    });
  }

  // 2. Proyectar ocurrencias futuras / recurrentes / rotativas para cada día del rango
  const reglasRecurrentes = tasks.filter(
    (t) => (t.tipoRecurrencia !== "Unica" || t.rotacionConfig) && !t.parentTaskId && !t.generadaPorCron
  );

  const numDias = Math.max(1, Math.round((finRango.getTime() - inicioRango.getTime()) / 86400000) + 1);

  for (let d = 0; d < numDias; d++) {
    const diaActual = new Date(inicioRango.getFullYear(), inicioRango.getMonth(), inicioRango.getDate() + d);
    const ymd = `${diaActual.getFullYear()}-${String(diaActual.getMonth() + 1).padStart(2, "0")}-${String(diaActual.getDate()).padStart(2, "0")}`;

    for (const regla of reglasRecurrentes) {
      const rot = normalizarRotacionConfig(regla.rotacionConfig);

      if (rot) {
        if (!ocurreRotacionEn(regla, diaActual)) continue;
        const responsables = responsablesEnDia(rot, diaActual, regla.anclaFecha ?? regla.fechaVencimiento);

        for (const uid of responsables) {
          const clave = `${regla.id}-${uid}-${ymd}`;
          if (instanciasExistentes.has(clave)) continue; // ya está en el calendario con su fila real

          const u = userMap.get(uid) ?? {
            id: uid,
            nombre: `Usuario ${uid}`,
            rolFamiliar: "Hijo",
            fotoUrl: null,
          };

          let start = new Date(diaActual);
          let end = new Date(start);
          let allDay = true;

          if (regla.horaEjecucion) {
            const orig = new Date(regla.horaEjecucion);
            start = new Date(diaActual.getFullYear(), diaActual.getMonth(), diaActual.getDate(), orig.getHours(), orig.getMinutes(), 0);
            const duracionSeg = Number(regla.tiempoEjecucionEstimadoSeg) || 1800;
            end = new Date(start.getTime() + duracionSeg * 1000);
            allDay = false;
          }

          const esGrupalEnDia = responsables.length > 1;
          const resource = {
            ...regla,
            id: `proj-${regla.id}-${uid}-${ymd}`,
            parentTaskId: regla.id,
            asignadoId: uid,
            asignado: u,
            estado: "Pendiente",
            fechaVencimiento: diaActual.toISOString(),
            horaEjecucion: allDay ? null : start.toISOString(),
            tipoTareaCalculado: esGrupalEnDia ? "grupal" : "rotativa",
            esGrupal: esGrupalEnDia,
            esProyectada: true,
          };

          eventos.push({
            id: `proj-${regla.id}-${uid}-${ymd}`,
            title: regla.titulo,
            start,
            end,
            allDay,
            resource,
          });
        }
        continue;
      }

      // Regla recurrente no rotativa
      if (!ocurreEn(regla, diaActual)) continue;
      const uid = Number(regla.asignadoId);
      const clave = `${regla.id}-${uid}-${ymd}`;
      if (instanciasExistentes.has(clave)) continue;

      const u = userMap.get(uid) ?? regla.asignado ?? {
        id: uid,
        nombre: `Usuario ${uid}`,
        rolFamiliar: "Hijo",
        fotoUrl: null,
      };

      let start = new Date(diaActual);
      let end = new Date(start);
      let allDay = true;

      if (regla.horaEjecucion) {
        const orig = new Date(regla.horaEjecucion);
        start = new Date(diaActual.getFullYear(), diaActual.getMonth(), diaActual.getDate(), orig.getHours(), orig.getMinutes(), 0);
        const duracionSeg = Number(regla.tiempoEjecucionEstimadoSeg) || 1800;
        end = new Date(start.getTime() + duracionSeg * 1000);
        allDay = false;
      }

      const tipo = regla.grupoTareaId ? "grupal" : "individual";
      const resource = {
        ...regla,
        id: `proj-${regla.id}-${uid}-${ymd}`,
        parentTaskId: regla.id,
        asignadoId: uid,
        asignado: u,
        estado: "Pendiente",
        fechaVencimiento: diaActual.toISOString(),
        horaEjecucion: allDay ? null : start.toISOString(),
        tipoTareaCalculado: tipo,
        esProyectada: true,
      };

      eventos.push({
        id: `proj-${regla.id}-${uid}-${ymd}`,
        title: regla.titulo,
        start,
        end,
        allDay,
        resource,
      });
    }
  }

  // 3. Aplicar filtros solicitados por el usuario
  const {
    usuarioId = null,
    dificultad = "todas",
    tipoTarea = "todas",
    recurrencia = "todas",
    recompensa = "todas",
    busqueda = "",
  } = filtros;

  const q = busqueda.trim().toLowerCase();

  return eventos.filter((ev) => {
    const res = ev.resource;

    // Filtro por usuario
    if (usuarioId !== null && usuarioId !== undefined) {
      if (Number(res.asignadoId) !== Number(usuarioId)) {
        return false;
      }
    }

    // Filtro por dificultad
    if (dificultad && dificultad !== "todas") {
      if ((res.dificultad ?? "Media") !== dificultad) {
        return false;
      }
    }

    // Filtro por tipo de tarea (rotativa, grupal, individual)
    if (tipoTarea && tipoTarea !== "todas") {
      const esRotativa = Boolean(res.rotacionConfig);
      const esGrupal = Boolean(
        res.grupoTareaId ||
        res.tipoTareaCalculado === "grupal" ||
        res.esGrupal ||
        res._isGrouped ||
        (Array.isArray(res._assignees) && res._assignees.length > 1)
      );
      if (tipoTarea === "rotativa" && !esRotativa) return false;
      if (tipoTarea === "grupal" && !esGrupal) return false;
      if (tipoTarea === "individual" && (esRotativa || esGrupal)) return false;
    }

    // Filtro por recurrente o no
    if (recurrencia && recurrencia !== "todas") {
      const esRecurrente = Boolean(
        (res.tipoRecurrencia && res.tipoRecurrencia !== "Unica") ||
        res.rotacionConfig ||
        res.parentTaskId
      );
      if (recurrencia === "recurrente" && !esRecurrente) return false;
      if (recurrencia === "unica" && esRecurrente) return false;
    }

    // Filtro por si genera recompensas o no
    if (recompensa && recompensa !== "todas") {
      const genera = Boolean(res.generaPuntosYRecompensa);
      if (recompensa === "con_recompensa" && !genera) return false;
      if (recompensa === "sin_recompensa" && genera) return false;
    }

    // Búsqueda por texto
    if (q) {
      const texto = `${res.titulo ?? ""} ${res.descripcion ?? ""}`.toLowerCase();
      if (!texto.includes(q)) return false;
    }

    return true;
  });
}
