import { nivelDe, xpTotal } from "./niveles.ts";
import type { EstadoHabito } from "./habitos/server.ts";

export type CategoriaLogro = "tareas" | "constancia" | "habitos" | "oracion" | "nivel" | "cartas";

export interface DatosCartaLogro {
  desbloqueada: boolean;
  rareza?: string;
  grado?: number;
}

export interface DatosLogros {
  usuario: {
    totalTasksCompleted?: number | null;
    streakDays?: number | null;
    stars?: number | null;
    completionPercentage?: number | null;
    puntosAcumulados?: number | null;
    experienciaHabitos?: number | null;
  };
  habitos: EstadoHabito[];
  cartas?: DatosCartaLogro[];
}

export interface Logro {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaLogro;
  icono: string;
  meta: number;
  actual: (d: DatosLogros) => number;
}

export interface LogroEvaluado extends Logro {
  obtenido: boolean;
  progreso: number;
  valorActual: number;
}

export const LOGROS: Logro[] = [
  // --- Constancia (rachas de tareas) ---
  {
    id: "racha-3",
    titulo: "En Racha",
    descripcion: "Alcanzá una racha de 3 días completando tareas.",
    categoria: "constancia",
    icono: "Flame",
    meta: 3,
    actual: (d) => d.usuario.streakDays ?? 0,
  },
  {
    id: "racha-7",
    titulo: "Imparable",
    descripcion: "Mantené una racha de 7 días consecutivos.",
    categoria: "constancia",
    icono: "Flame",
    meta: 7,
    actual: (d) => d.usuario.streakDays ?? 0,
  },
  {
    id: "racha-30",
    titulo: "Leyenda del Hábito",
    descripcion: "Alcanzá 30 días de racha sin interrupciones.",
    categoria: "constancia",
    icono: "Flame",
    meta: 30,
    actual: (d) => d.usuario.streakDays ?? 0,
  },

  // --- Tareas y completitud ---
  {
    id: "completitud-80",
    titulo: "Francotirador",
    descripcion: "Alcanzá al menos 80% de completitud con más de 2 tareas.",
    categoria: "tareas",
    icono: "Target",
    meta: 80,
    actual: (d) => ((d.usuario.totalTasksCompleted ?? 0) > 2 ? (d.usuario.completionPercentage ?? 0) : 0),
  },
  {
    id: "completitud-95",
    titulo: "Perfeccionista",
    descripcion: "Superá el 95% de completitud con más de 5 tareas.",
    categoria: "tareas",
    icono: "Target",
    meta: 95,
    actual: (d) => ((d.usuario.totalTasksCompleted ?? 0) > 5 ? (d.usuario.completionPercentage ?? 0) : 0),
  },
  {
    id: "tareas-10",
    titulo: "Iniciado",
    descripcion: "Completá tus primeras 10 tareas familiares.",
    categoria: "tareas",
    icono: "Award",
    meta: 10,
    actual: (d) => d.usuario.totalTasksCompleted ?? 0,
  },
  {
    id: "tareas-50",
    titulo: "Veterano",
    descripcion: "Completá 50 tareas en el hogar.",
    categoria: "tareas",
    icono: "Trophy",
    meta: 50,
    actual: (d) => d.usuario.totalTasksCompleted ?? 0,
  },
  {
    id: "tareas-100",
    titulo: "Maestro Centurión",
    descripcion: "Alcanzá la marca legendaria de 100 tareas completadas.",
    categoria: "tareas",
    icono: "Trophy",
    meta: 100,
    actual: (d) => d.usuario.totalTasksCompleted ?? 0,
  },
  {
    id: "estrellas-10",
    titulo: "Coleccionista",
    descripcion: "Reuní 10 estrellas por tu buen desempeño.",
    categoria: "tareas",
    icono: "Star",
    meta: 10,
    actual: (d) => d.usuario.stars ?? 0,
  },
  {
    id: "estrellas-50",
    titulo: "Superestrella",
    descripcion: "Acumulá 50 estrellas ganadas con constancia.",
    categoria: "tareas",
    icono: "Star",
    meta: 50,
    actual: (d) => d.usuario.stars ?? 0,
  },

  // --- Niveles ---
  {
    id: "nivel-5",
    titulo: "Guerrero disciplinado",
    descripcion: "Alcanzá el nivel 5 sumando tareas y hábitos.",
    categoria: "nivel",
    icono: "Shield",
    meta: 5,
    actual: (d) => nivelDe(xpTotal(d.usuario)).level,
  },
  {
    id: "nivel-10",
    titulo: "Maestro de tareas",
    descripcion: "Alcanzá el nivel 10 en la vida familiar.",
    categoria: "nivel",
    icono: "Crown",
    meta: 10,
    actual: (d) => nivelDe(xpTotal(d.usuario)).level,
  },
  {
    id: "nivel-20",
    titulo: "Columna de la familia",
    descripcion: "Alcanzá el nivel 20 como pilar del hogar.",
    categoria: "nivel",
    icono: "Zap",
    meta: 20,
    actual: (d) => nivelDe(xpTotal(d.usuario)).level,
  },

  // --- Hábitos personales y generales ---
  {
    id: "habito-primer",
    titulo: "Primer hábito",
    descripcion: "Adoptá tu primer hábito en Ordo Diei.",
    categoria: "habitos",
    icono: "Sparkles",
    meta: 1,
    actual: (d) => d.habitos.length,
  },
  {
    id: "habito-primer-paso",
    titulo: "Primer paso subido",
    descripcion: "Subí tu primer escalón en cualquier hábito.",
    categoria: "habitos",
    icono: "TrendingUp",
    meta: 1,
    actual: (d) => (d.habitos.some((h) => h.paso > 1 || h.etapa !== "inicio") ? 1 : 0),
  },
  {
    id: "habito-7-dias",
    titulo: "7 días seguidos",
    descripcion: "Completá 7 días seguidos en cualquier hábito sin faltar.",
    categoria: "habitos",
    icono: "CalendarCheck",
    meta: 7,
    actual: (d) => Math.max(0, ...d.habitos.map((h) => h.seguidos)),
  },
  {
    id: "habito-firme",
    titulo: "Hábito firme",
    descripcion: "Llevá un hábito a la etapa Firme (constancia >= 80%).",
    categoria: "habitos",
    icono: "ShieldCheck",
    meta: 1,
    actual: (d) => d.habitos.filter((h) => h.etapa === "firme").length,
  },
  {
    id: "habito-3-firmes",
    titulo: "Tres pilares",
    descripcion: "Consolidá 3 hábitos en etapa Firme simultáneamente.",
    categoria: "habitos",
    icono: "Trophy",
    meta: 3,
    actual: (d) => d.habitos.filter((h) => h.etapa === "firme").length,
  },
  {
    id: "habito-escalera",
    titulo: "Escalera completa",
    descripcion: "Llegá a la cima del último paso de cualquier hábito.",
    categoria: "habitos",
    icono: "Mountain",
    meta: 1,
    actual: (d) => (d.habitos.some((h) => h.completo || h.paso >= h.pasos) ? 1 : 0),
  },
  {
    id: "habito-casa-en-orden",
    titulo: "Casa en orden",
    descripcion: "Tener la cama y ordenar el ropero en etapa Firme.",
    categoria: "habitos",
    icono: "Home",
    meta: 2,
    actual: (d) => {
      const cama = d.habitos.some((h) => h.clave === "cama" && h.etapa === "firme");
      const ropero = d.habitos.some((h) => h.clave === "ropero" && h.etapa === "firme");
      return (cama ? 1 : 0) + (ropero ? 1 : 0);
    },
  },
  {
    id: "habito-volver",
    titulo: "Volver a empezar",
    descripcion: "Retomá el camino con perseverancia tras una recaída.",
    categoria: "habitos",
    icono: "RefreshCw",
    meta: 1,
    actual: (d) => {
      const retorno = d.habitos.some((h) => {
        if (h.eventos?.includes("regreso")) return true;
        if (h.recaidaEl && h.seguidos > 0) return true;
        // Detectar caída y recuperación en trayectoria
        if (h.trayectoria && h.trayectoria.length > 5) {
          let bajo = false;
          for (const pt of h.trayectoria) {
            if (pt.constancia < 0.5) bajo = true;
            if (bajo && pt.constancia >= 0.6) return true;
          }
        }
        return false;
      });
      return retorno ? 1 : 0;
    },
  },

  // --- Oración ---
  {
    id: "habito-rosario",
    titulo: "Rosario completo",
    descripcion: "Rezá el Santo Rosario completo (5 misterios) a diario.",
    categoria: "oracion",
    icono: "Heart",
    meta: 1,
    actual: (d) => {
      const r = d.habitos.find((h) => h.clave === "rosario");
      return r && (r.completo || r.paso >= 15) ? 1 : 0;
    },
  },
  {
    id: "habito-30-completorium",
    titulo: "30 noches de oración",
    descripcion: "Rezá las oraciones de la noche (Completorium) 30 veces.",
    categoria: "oracion",
    icono: "Moon",
    meta: 30,
    actual: (d) => {
      const c = d.habitos.find((h) => h.clave === "completorium");
      if (!c?.trayectoria) return 0;
      return c.trayectoria.filter((p) => p.marca === "hecho").length;
    },
  },
  {
    id: "habito-madrugador",
    titulo: "Madrugador",
    descripcion: "Alcanzá la consolidación en las oraciones de la mañana.",
    categoria: "oracion",
    icono: "Sun",
    meta: 1,
    actual: (d) => {
      const m = d.habitos.find((h) => h.clave === "matutinum");
      return m && (m.etapa === "consolidacion" || m.etapa === "firme") ? 1 : 0;
    },
  },

  // --- Cartas Católicas (D12) ---
  {
    id: "carta-primera",
    titulo: "Primera carta",
    descripcion: "Desbloqueá tu primera carta católica consagrada.",
    categoria: "cartas",
    icono: "Layers",
    meta: 1,
    actual: (d) => (d.cartas || []).filter((c) => c.desbloqueada).length >= 1 ? 1 : 0,
  },
  {
    id: "cartas-10",
    titulo: "Coleccionista de 10",
    descripcion: "Reuní 10 cartas sagradas desbloqueadas en tu álbum.",
    categoria: "cartas",
    icono: "Layers",
    meta: 10,
    actual: (d) => (d.cartas || []).filter((c) => c.desbloqueada).length,
  },
  {
    id: "carta-primera-celestial",
    titulo: "Primera Celestial",
    descripcion: "Desbloqueá tu primera carta de rareza Celestial.",
    categoria: "cartas",
    icono: "Sparkles",
    meta: 1,
    actual: (d) =>
      (d.cartas || []).filter((c) => c.desbloqueada && c.rareza === "Celestial").length >= 1
        ? 1
        : 0,
  },
  {
    id: "carta-primera-gloriosa",
    titulo: "Primera carta Gloriosa",
    descripcion: "Consagrá una carta al Grado IV (Gloriosa) alcanzando el 300 % de veneración.",
    categoria: "cartas",
    icono: "Crown",
    meta: 1,
    actual: (d) => (d.cartas || []).filter((c) => (c.grado ?? 0) >= 4).length >= 1 ? 1 : 0,
  },
];

/**
 * Evalúa todos los logros para un usuario y su conjunto de hábitos.
 * Devuelve la lista ordenada: obtenidos primero, y luego por mayor progreso descendente.
 */
export function evaluarLogros(d: DatosLogros): LogroEvaluado[] {
  const evaluados: LogroEvaluado[] = LOGROS.map((l) => {
    const rawVal = l.actual(d);
    const valorActual = Math.max(0, isNaN(rawVal) ? 0 : rawVal);
    const obtenido = valorActual >= l.meta;
    const progreso =
      l.meta > 0 ? Math.min(1, Math.max(0, valorActual / l.meta)) : obtenido ? 1 : 0;
    return {
      ...l,
      obtenido,
      progreso,
      valorActual,
    };
  });

  return evaluados.sort((a, b) => {
    if (a.obtenido && !b.obtenido) return -1;
    if (!a.obtenido && b.obtenido) return 1;
    return b.progreso - a.progreso;
  });
}
