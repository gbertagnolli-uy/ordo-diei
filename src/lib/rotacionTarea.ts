import { ocurreEn } from "./recurrenceUtils.ts";

export type ModoRotacion = "frecuencia" | "dias_semana";
export type UnidadRotacion = "dias" | "semanas" | "meses";
export type UnidadFrecuenciaRotacion = UnidadRotacion;

export interface RotacionConfig {
  modo: ModoRotacion;
  /** IDs de los usuarios responsables en orden de rotación */
  responsablesIds: number[];
  /** Para modo === "frecuencia": cada cuántas unidades cambia el responsable (default: 1) */
  cada?: number;
  /** Para modo === "frecuencia": unidad de variación ("dias" | "semanas" | "meses", default: "dias") */
  unidad?: UnidadRotacion;
  /**
   * Para modo === "dias_semana": mapa de usuarioId (string) a arreglo de días de la semana (0=Dom..6=Sáb)
   * Ej: { "1": [1, 3, 5], "2": [2, 4, 6] }
   */
  diasPorUsuario?: Record<string, number[]>;
  /** Fecha base/ancla en formato YYYY-MM-DD */
  fechaInicio?: string;
  fechaAncla?: string;
}

const UNIDADES_VALIDAS: readonly UnidadRotacion[] = ["dias", "semanas", "meses"];
const ESTADOS_ACTIVOS_TAREA = new Set(["Pendiente", "En_progreso", "Pausada", "Rechazada"]);

export const DIAS_SEMANA_OPCIONES = [
  { valor: 1, corto: "L", nombre: "Lunes" },
  { valor: 2, corto: "M", nombre: "Martes" },
  { valor: 3, corto: "X", nombre: "Miércoles" },
  { valor: 4, corto: "J", nombre: "Jueves" },
  { valor: 5, corto: "V", nombre: "Viernes" },
  { valor: 6, corto: "S", nombre: "Sábado" },
  { valor: 0, corto: "D", nombre: "Domingo" },
] as const;

export const DIAS_SEMANA_ORDEN: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

export const ETIQUETA_DIA_CORTO: Record<number, string> = {
  1: "L",
  2: "M",
  3: "X",
  4: "J",
  5: "V",
  6: "S",
  0: "D",
};

export function formatearFechaLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parsearFechaLocal(valor: Date | string | null | undefined): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) {
    if (isNaN(valor.getTime())) return null;
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }
  if (typeof valor === "string") {
    const limpio = valor.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(limpio);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const parsed = new Date(limpio);
    if (!isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }
  return null;
}

export function diasCalendarioEntre(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

export function mesesCalendarioEntre(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function esMismoDiaCalendario(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Normaliza y valida una configuración de rotación proveniente de la base o del cliente.
 */
export function normalizarRotacionConfig(raw: unknown): RotacionConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const modo = obj.modo;
  if (modo !== "frecuencia" && modo !== "dias_semana") return null;

  const responsablesRaw = Array.isArray(obj.responsablesIds) ? obj.responsablesIds : [];
  const responsablesIds = [
    ...new Set(
      responsablesRaw
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
  ];

  const fechaInicioParsed = parsearFechaLocal(
    (obj.fechaInicio ?? obj.fechaAncla) as string | undefined
  );
  const fechaInicio = fechaInicioParsed ? formatearFechaLocalISO(fechaInicioParsed) : undefined;

  if (modo === "frecuencia") {
    if (responsablesIds.length === 0) return null;
    const cadaNum = Math.round(Number(obj.cada) || 1);
    const cada = Math.max(1, Math.min(365, cadaNum));
    const unidad: UnidadRotacion = (UNIDADES_VALIDAS as readonly string[]).includes(String(obj.unidad))
      ? (obj.unidad as UnidadRotacion)
      : "dias";
    return {
      modo: "frecuencia",
      responsablesIds,
      cada,
      unidad,
      ...(fechaInicio ? { fechaInicio } : {}),
    };
  }

  // modo === "dias_semana"
  const rawMapa =
    obj.diasPorUsuario && typeof obj.diasPorUsuario === "object"
      ? (obj.diasPorUsuario as Record<string, unknown>)
      : {};

  const diasPorUsuario: Record<string, number[]> = {};
  const idsConDias: number[] = [];

  const todosLosIds = [
    ...new Set([
      ...responsablesIds,
      ...Object.keys(rawMapa)
        .map((k) => Number(k))
        .filter((n) => Number.isInteger(n) && n > 0),
    ]),
  ];

  for (const uid of todosLosIds) {
    const arr = rawMapa[String(uid)];
    if (!Array.isArray(arr)) continue;
    const diasLimpios = [
      ...new Set(
        arr
          .map((d) => Number(d))
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      ),
    ].sort((a, b) => a - b);
    if (diasLimpios.length > 0) {
      diasPorUsuario[String(uid)] = diasLimpios;
      idsConDias.push(uid);
    }
  }

  const listaFinalIds = responsablesIds.length > 0 ? responsablesIds : idsConDias;
  if (listaFinalIds.length === 0 || Object.keys(diasPorUsuario).length === 0) return null;

  return {
    modo: "dias_semana",
    responsablesIds: listaFinalIds,
    diasPorUsuario,
    ...(fechaInicio ? { fechaInicio } : {}),
  };
}

/**
 * Determina todos los usuarios (usuarioIds) responsables de la tarea en la fecha `dia`.
 * En modo "dias_semana" permite más de un responsable por día (tareas en grupo).
 * Devuelve un arreglo vacío si en ese día no le corresponde a nadie.
 */
export function responsablesEnDia(
  rawConfig: RotacionConfig | unknown,
  dia: Date,
  anclaFallback?: Date | string | null
): number[] {
  const config = normalizarRotacionConfig(rawConfig);
  if (!config) return [];

  const diaLocal = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  const base =
    parsearFechaLocal(config.fechaInicio) ??
    parsearFechaLocal(anclaFallback) ??
    diaLocal;

  if (config.modo === "dias_semana") {
    const dow = diaLocal.getDay();
    const mapa = config.diasPorUsuario ?? {};
    const resultado: number[] = [];
    const vistos = new Set<number>();

    for (const uid of config.responsablesIds) {
      const dias = mapa[String(uid)];
      if (Array.isArray(dias) && dias.includes(dow) && !vistos.has(uid)) {
        resultado.push(uid);
        vistos.add(uid);
      }
    }
    for (const [k, dias] of Object.entries(mapa)) {
      const uid = Number(k);
      if (Number.isInteger(uid) && uid > 0 && Array.isArray(dias) && dias.includes(dow) && !vistos.has(uid)) {
        resultado.push(uid);
        vistos.add(uid);
      }
    }
    return resultado;
  }

  // modo === "frecuencia"
  const n = config.responsablesIds.length;
  if (n === 0) return [];
  const cada = Math.max(1, config.cada ?? 1);
  const unidad = config.unidad ?? "dias";

  let pasos = 0;
  if (unidad === "dias") {
    pasos = diasCalendarioEntre(base, diaLocal);
  } else if (unidad === "semanas") {
    pasos = Math.floor(diasCalendarioEntre(base, diaLocal) / 7);
  } else {
    pasos = mesesCalendarioEntre(base, diaLocal);
  }

  const bloque = Math.floor(pasos / cada);
  const idx = ((bloque % n) + n) % n;
  const uid = config.responsablesIds[idx];
  return uid ? [uid] : [];
}

/**
 * Determina el primer usuario (usuarioId) responsable de la tarea en la fecha `dia`.
 * Devuelve `null` si en ese día no le corresponde a nadie.
 * Conservado por compatibilidad hacia atrás.
 */
export function responsableEnDia(
  rawConfig: RotacionConfig | unknown,
  dia: Date,
  anclaFallback?: Date | string | null
): number | null {
  const lista = responsablesEnDia(rawConfig, dia, anclaFallback);
  return lista.length > 0 ? lista[0] : null;
}

/**
 * ¿Le toca ejecutarse a esta tarea rotativa en `dia`?
 */
export function ocurreRotacionEn(
  regla: {
    tipoRecurrencia: string;
    fechaVencimiento: Date | null;
    diaDelMes?: number | null;
    ordinalSemana?: number | null;
    diaDeLaSemana?: number | null;
    intervalo?: number | null;
    anclaFecha?: Date | null;
    rotacionConfig?: unknown;
  },
  dia: Date
): boolean {
  const config = normalizarRotacionConfig(regla.rotacionConfig);
  if (!config) return ocurreEn(regla, dia);

  const diaLocal = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  const base =
    parsearFechaLocal(config.fechaInicio) ??
    parsearFechaLocal(regla.anclaFecha) ??
    parsearFechaLocal(regla.fechaVencimiento);

  if (base && diasCalendarioEntre(base, diaLocal) < 0) {
    return false;
  }

  if (config.modo === "dias_semana") {
    return responsablesEnDia(config, diaLocal, base).length > 0;
  }

  // modo === "frecuencia"
  if (regla.tipoRecurrencia === "Unica" || regla.tipoRecurrencia === "Diaria") {
    const intervalo = Math.max(1, regla.intervalo ?? 1);
    if (intervalo <= 1 || !base) return true;
    return diasCalendarioEntre(base, diaLocal) % intervalo === 0;
  }

  return ocurreEn(regla, diaLocal);
}

/**
 * Busca a partir de `desdeDia` (inclusive) la primera fecha en que la tarea rotativa ocurre
 * y devuelve `{ fecha, asignadoId, asignadosIds }`.
 */
export function primerasAsignacionesRotativas(
  regla: {
    tipoRecurrencia: string;
    fechaVencimiento: Date | null;
    diaDelMes?: number | null;
    ordinalSemana?: number | null;
    diaDeLaSemana?: number | null;
    intervalo?: number | null;
    anclaFecha?: Date | null;
    rotacionConfig?: unknown;
  },
  desdeDia: Date = new Date()
): { fecha: Date; asignadoId: number; asignadosIds: number[] } | null {
  const config = normalizarRotacionConfig(regla.rotacionConfig);
  if (!config) return null;

  const inicio = new Date(desdeDia.getFullYear(), desdeDia.getMonth(), desdeDia.getDate());
  const base =
    parsearFechaLocal(config.fechaInicio) ??
    parsearFechaLocal(regla.anclaFecha) ??
    parsearFechaLocal(regla.fechaVencimiento) ??
    inicio;

  const puntoPartida = diasCalendarioEntre(inicio, base) > 0 ? base : inicio;

  for (let offset = 0; offset <= 366; offset++) {
    const candidato = new Date(
      puntoPartida.getFullYear(),
      puntoPartida.getMonth(),
      puntoPartida.getDate() + offset
    );
    if (!ocurreRotacionEn(regla, candidato)) continue;
    const asignadosIds = responsablesEnDia(config, candidato, base);
    if (asignadosIds.length > 0) {
      return { fecha: candidato, asignadoId: asignadosIds[0], asignadosIds };
    }
  }
  return null;
}

/**
 * Busca a partir de `desdeDia` (inclusive) la primera fecha en que la tarea rotativa ocurre
 * y devuelve `{ fecha, asignadoId }`.
 */
export function primeraAsignacionRotativa(
  regla: {
    tipoRecurrencia: string;
    fechaVencimiento: Date | null;
    diaDelMes?: number | null;
    ordinalSemana?: number | null;
    diaDeLaSemana?: number | null;
    intervalo?: number | null;
    anclaFecha?: Date | null;
    rotacionConfig?: unknown;
  },
  desdeDia: Date = new Date()
): { fecha: Date; asignadoId: number } | null {
  const res = primerasAsignacionesRotativas(regla, desdeDia);
  if (!res) return null;
  return { fecha: res.fecha, asignadoId: res.asignadoId };
}

/**
 * Determina si una tarea debe mostrarse al usuario `usuarioId` en el día `hoy`.
 * Para tareas con rotación: si la tarea está activa (Pendiente / En_progreso / Pausada / Rechazada),
 * SOLO le aparece a la persona que la tiene asignada en el día en que la tiene asignada.
 * En tareas en grupo con más de un responsable el mismo día, le aparece a cualquiera de ellos.
 */
export function esTareaVisibleParaUsuarioEnDia(
  tarea: {
    asignadoId: number;
    estado: string;
    fechaVencimiento?: Date | string | null;
    horaEjecucion?: Date | string | null;
    anclaFecha?: Date | string | null;
    rotacionConfig?: unknown;
  },
  usuarioId: number,
  hoy: Date = new Date()
): boolean {
  if (Number(tarea.asignadoId) !== Number(usuarioId)) return false;

  const config = normalizarRotacionConfig(tarea.rotacionConfig);
  if (!config) return true;

  // Si la tarea está en un estado activo (por hacer / en curso), solo debe aparecer
  // en el día que corresponde y únicamente al o los responsables de ese día.
  if (ESTADOS_ACTIVOS_TAREA.has(tarea.estado)) {
    const fechaRef = parsearFechaLocal(tarea.fechaVencimiento ?? tarea.horaEjecucion);
    if (fechaRef && !esMismoDiaCalendario(fechaRef, hoy)) {
      return false;
    }
    const responsablesHoy = responsablesEnDia(
      config,
      hoy,
      tarea.anclaFecha ?? tarea.fechaVencimiento
    );
    if (!responsablesHoy.includes(Number(usuarioId))) {
      return false;
    }
  }

  return true;
}

/**
 * Etiqueta breve para mostrar cómo rota una tarea compartida.
 */
export function describirRotacion(rawConfig: RotacionConfig | unknown): string | null {
  const config = normalizarRotacionConfig(rawConfig);
  if (!config) return null;

  if (config.modo === "dias_semana") {
    const mapa = config.diasPorUsuario ?? {};
    const conteoPorDia: Record<number, number> = {};
    for (const dias of Object.values(mapa)) {
      if (Array.isArray(dias)) {
        for (const d of dias) {
          conteoPorDia[d] = (conteoPorDia[d] ?? 0) + 1;
        }
      }
    }
    const hayGrupal = Object.values(conteoPorDia).some((c) => c > 1);
    return hayGrupal ? "Rotativa · días asignados (en grupo)" : "Rotativa · días asignados";
  }

  const cada = config.cada ?? 1;
  const unidad = config.unidad ?? "dias";
  if (unidad === "dias") {
    return cada === 1 ? "Rotativa · cada día" : `Rotativa · cada ${cada} días`;
  }
  if (unidad === "semanas") {
    return cada === 1 ? "Rotativa · cada semana" : `Rotativa · cada ${cada} semanas`;
  }
  return cada === 1 ? "Rotativa · cada mes" : `Rotativa · cada ${cada} meses`;
}

