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

  // Mapa de instancias concretas que ya existen en la base por fecha
  const instanciasExistentes = new Set<string>();

  // Agrupamos instancias concretas que pertenecen a la misma ocurrencia/día
  // (mismo grupoTareaId, mismo parentTaskId o misma tarea base en la misma fecha)
  const gruposConcretosPorDia = new Map<
    string,
    {
      base: any;
      items: any[];
      dia: Date;
      ymd: string;
      start: Date;
      end: Date;
      allDay: boolean;
    }
  >();

  for (const t of tasks) {
    // Si es una regla/plantilla base recurrente o rotativa, su fechaVencimiento/horaEjecucion
    // representa la fecha de creación de la regla. Solo debe proyectarse en el Paso 2
    // en los días reales en que ocurre según su frecuencia/días asignados.
    const esRecurrente = Boolean(t.tipoRecurrencia && t.tipoRecurrencia !== "Unica");
    const esRotativa = Boolean(t.rotacionConfig && normalizarRotacionConfig(t.rotacionConfig));
    const esPlantillaBase = (esRecurrente || esRotativa) && !t.parentTaskId && !t.generadaPorCron;
    if (esPlantillaBase) continue;

    const fv = parsearFechaLocal(t.fechaVencimiento ?? t.horaEjecucion);
    if (!fv) continue;
    if (fv < inicioRango || fv > finRangoFinDelDia) continue;

    const ymd = `${fv.getFullYear()}-${String(fv.getMonth() + 1).padStart(2, "0")}-${String(fv.getDate()).padStart(2, "0")}`;
    const baseId = t.parentTaskId ?? t.id;
    instanciasExistentes.add(`${baseId}-${ymd}`);
    instanciasExistentes.add(`${t.id}-${ymd}`);
    if (t.grupoTareaId) {
      instanciasExistentes.add(`group-${t.grupoTareaId}-${ymd}`);
    }
    if (t.asignadoId) {
      instanciasExistentes.add(`${baseId}-${t.asignadoId}-${ymd}`);
    }

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

    // Clave de unificación para que tareas del mismo grupo compartan un único cuadro
    const key = t.grupoTareaId
      ? `grupo:${t.grupoTareaId}:${ymd}`
      : t.parentTaskId
      ? `parent:${t.parentTaskId}:${ymd}`
      : `tarea:${t.id}:${ymd}`;

    if (gruposConcretosPorDia.has(key)) {
      const g = gruposConcretosPorDia.get(key)!;
      g.items.push(t);
    } else {
      gruposConcretosPorDia.set(key, {
        base: t,
        items: [t],
        dia: fv,
        ymd,
        start,
        end,
        allDay,
      });
    }
  }

  const eventos: EventoCalendarioProyectado[] = [];

  // 1. Convertir los grupos de instancias concretas en eventos unificados
  for (const entry of gruposConcretosPorDia.values()) {
    const { base, items, dia, start, end, allDay } = entry;

    const rot = normalizarRotacionConfig(base.rotacionConfig);
    const resp = rot ? responsablesEnDia(rot, dia, base.anclaFecha ?? base.fechaVencimiento) : [];

    // Recolectar asignados asignados específicamente para este día
    let rawIds: number[] = [];
    if (rot && resp.length > 0) {
      rawIds = resp;
    } else {
      for (const it of items) {
        if (Array.isArray(it._assignees) && it._assignees.length > 0) {
          for (const a of it._assignees) {
            if (a && a.id) rawIds.push(Number(a.id));
          }
        } else if (it.asignadoId) {
          rawIds.push(Number(it.asignadoId));
        } else if (it.asignado?.id) {
          rawIds.push(Number(it.asignado.id));
        }
      }
    }

    const uniqueUids = [...new Set(rawIds)];
    const asignados: UsuarioBasico[] = uniqueUids.map((uid) => {
      return (
        userMap.get(uid) ??
        items.find((it) => it.asignado?.id === uid)?.asignado ?? {
          id: uid,
          nombre: `Usuario ${uid}`,
          rolFamiliar: "Hijo",
          fotoUrl: null,
        }
      );
    });

    const esGrupalEnDia =
      asignados.length > 1 ||
      Boolean(base.grupoTareaId || base._isGrouped || items.length > 1);

    const tipo = rot ? "rotativa" : esGrupalEnDia ? "grupal" : determinarTipoTarea(base);

    // Estado calculado para el grupo
    let estadoFinal = base.estado ?? "Pendiente";
    const todosEstados = items.map((it) => it.estado).filter(Boolean);
    if (todosEstados.length > 0) {
      if (todosEstados.every((e) => e === "Completada" || e === "Aprobada")) {
        estadoFinal = "Completada";
      } else if (todosEstados.some((e) => e === "Esperando_Aprobacion")) {
        estadoFinal = "Esperando_Aprobacion";
      } else if (todosEstados.some((e) => e === "En_progreso")) {
        estadoFinal = "En_progreso";
      } else if (todosEstados.some((e) => e === "Vencida" || e === "Expirada")) {
        estadoFinal = "Vencida";
      }
    }

    const resource = {
      ...base,
      _groupTasks: items,
      estado: estadoFinal,
      asignados,
      asignado: asignados[0] ?? null,
      asignadoId: asignados[0]?.id ?? base.asignadoId,
      asignadosIds: asignados.map((a) => a.id),
      tipoTareaCalculado: tipo,
      esGrupal: esGrupalEnDia,
      esProyectada: false,
    };

    eventos.push({
      id: base.id,
      title: base.titulo,
      start,
      end,
      allDay,
      resource,
    });
  }

  const reglasRecurrentes = tasks.filter((t) => {
    const esRecurrente = Boolean(t.tipoRecurrencia && t.tipoRecurrencia !== "Unica");
    const esRotativa = Boolean(t.rotacionConfig && normalizarRotacionConfig(t.rotacionConfig));
    return (esRecurrente || esRotativa) && !t.parentTaskId && !t.generadaPorCron;
  });

  // Deduplicamos reglas que pertenecen al mismo grupoTareaId para no proyectar doble
  const reglasUnicasMap = new Map<string, any>();
  for (const r of reglasRecurrentes) {
    const k = r.grupoTareaId ? `group:${r.grupoTareaId}` : `task:${r.id}`;
    if (!reglasUnicasMap.has(k)) {
      reglasUnicasMap.set(k, r);
    }
  }
  const reglasUnicas = Array.from(reglasUnicasMap.values());

  const numDias = Math.max(1, Math.round((finRango.getTime() - inicioRango.getTime()) / 86400000) + 1);

  for (let d = 0; d < numDias; d++) {
    const diaActual = new Date(inicioRango.getFullYear(), inicioRango.getMonth(), inicioRango.getDate() + d);
    const ymd = `${diaActual.getFullYear()}-${String(diaActual.getMonth() + 1).padStart(2, "0")}-${String(diaActual.getDate()).padStart(2, "0")}`;

    for (const regla of reglasUnicas) {
      // Si ya hay una instancia concreta guardada en base para este día, saltar
      if (instanciasExistentes.has(`${regla.id}-${ymd}`)) continue;
      if (regla.grupoTareaId && instanciasExistentes.has(`group-${regla.grupoTareaId}-${ymd}`)) continue;

      const rot = normalizarRotacionConfig(regla.rotacionConfig);

      if (rot) {
        if (!ocurreRotacionEn(regla, diaActual)) continue;
        const responsables = responsablesEnDia(rot, diaActual, regla.anclaFecha ?? regla.fechaVencimiento);
        if (responsables.length === 0) continue;

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

        const asignados: UsuarioBasico[] = responsables.map((uid) => {
          return (
            userMap.get(uid) ?? {
              id: uid,
              nombre: `Usuario ${uid}`,
              rolFamiliar: "Hijo",
              fotoUrl: null,
            }
          );
        });

        const esGrupalEnDia = responsables.length > 1;
        const resource = {
          ...regla,
          id: `proj-${regla.id}-${ymd}`,
          parentTaskId: regla.id,
          asignados,
          asignado: asignados[0] ?? null,
          asignadoId: asignados[0]?.id ?? regla.asignadoId,
          asignadosIds: asignados.map((a) => a.id),
          estado: "Pendiente",
          fechaVencimiento: diaActual.toISOString(),
          horaEjecucion: allDay ? null : start.toISOString(),
          tipoTareaCalculado: esGrupalEnDia ? "grupal" : "rotativa",
          esGrupal: esGrupalEnDia,
          esProyectada: true,
        };

        // Exactamente UN cuadro por tarea ese día
        eventos.push({
          id: `proj-${regla.id}-${ymd}`,
          title: regla.titulo,
          start,
          end,
          allDay,
          resource,
        });
        continue;
      }

      // Regla recurrente no rotativa
      if (!ocurreEn(regla, diaActual)) continue;

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

      // Si la regla tenía co-responsables (grupoTareaId)
      const groupRules = regla.grupoTareaId
        ? tasks.filter((t) => t.grupoTareaId === regla.grupoTareaId && !t.parentTaskId && !t.generadaPorCron)
        : [regla];

      const rawUids = groupRules
        .flatMap((gr) =>
          Array.isArray(gr._assignees)
            ? gr._assignees.map((a: any) => Number(a.id))
            : [Number(gr.asignadoId)]
        )
        .filter(Boolean);

      const uids = [...new Set(rawUids)];
      const asignados: UsuarioBasico[] = uids.map((uid) => {
        return (
          userMap.get(uid) ??
          groupRules.find((r) => r.asignado?.id === uid)?.asignado ?? {
            id: uid,
            nombre: `Usuario ${uid}`,
            rolFamiliar: "Hijo",
            fotoUrl: null,
          }
        );
      });

      const esGrupalEnDia = asignados.length > 1;
      const resource = {
        ...regla,
        id: `proj-${regla.id}-${ymd}`,
        parentTaskId: regla.id,
        asignados,
        asignado: asignados[0] ?? null,
        asignadoId: asignados[0]?.id ?? regla.asignadoId,
        asignadosIds: asignados.map((a) => a.id),
        estado: "Pendiente",
        fechaVencimiento: diaActual.toISOString(),
        horaEjecucion: allDay ? null : start.toISOString(),
        tipoTareaCalculado: esGrupalEnDia ? "grupal" : "individual",
        esGrupal: esGrupalEnDia,
        esProyectada: true,
      };

      // Exactamente UN cuadro por tarea ese día
      eventos.push({
        id: `proj-${regla.id}-${ymd}`,
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
      const uIdNum = Number(usuarioId);
      const ids: number[] = Array.isArray(res.asignadosIds)
        ? res.asignadosIds
        : Array.isArray(res.asignados)
        ? res.asignados.map((u: any) => Number(u.id))
        : [Number(res.asignadoId)];
      if (!ids.includes(uIdNum)) {
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
        (Array.isArray(res._assignees) && res._assignees.length > 1) ||
        (Array.isArray(res.asignados) && res.asignados.length > 1)
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
