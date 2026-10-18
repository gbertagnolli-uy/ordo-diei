// Puntos base de una tarea según su dificultad y su tiempo estimado.
// Diseño y tabla de ejemplos: vault/LANE_67_DIFICULTAD_RECOMPENSA.md

export const DIFICULTADES = ["Trivial", "MuyFacil", "Facil", "Media", "Exigente", "Dificil", "MuyDificil", "Ardua"] as const;
export type Dificultad = (typeof DIFICULTADES)[number];

export const DIFICULTAD_DEFAULT: Dificultad = "Media";

export const DIFICULTAD_INFO: Record<Dificultad, { etiqueta: string; multiplicador: number }> = {
  Trivial: { etiqueta: "Trivial", multiplicador: 0.5 },
  MuyFacil: { etiqueta: "Muy fácil", multiplicador: 0.65 },
  Facil: { etiqueta: "Fácil", multiplicador: 0.85 },
  Media: { etiqueta: "Media", multiplicador: 1.1 },
  Exigente: { etiqueta: "Exigente", multiplicador: 1.45 },
  Dificil: { etiqueta: "Difícil", multiplicador: 1.9 },
  MuyDificil: { etiqueta: "Muy difícil", multiplicador: 2.45 },
  Ardua: { etiqueta: "Ardua", multiplicador: 3.2 },
};

const PUNTOS_POR_RAIZ_DE_MINUTO = 4; // el tiempo rinde con raíz cuadrada: 4× tiempo = 2× puntos
const PUNTOS_MINIMOS = 5;
const PUNTOS_MAXIMOS = 150;

export function esDificultad(v: unknown): v is Dificultad {
  return typeof v === "string" && (DIFICULTADES as readonly string[]).includes(v);
}

/** puntos = 4·√minutos × multiplicador(dificultad), redondeado y acotado a [5, 150]. */
export function puntosBase(dificultad: Dificultad | null | undefined, tiempoSeg: number): number {
  const minutos = Math.max(0, (tiempoSeg || 0) / 60);
  const mult = DIFICULTAD_INFO[dificultad ?? DIFICULTAD_DEFAULT].multiplicador;
  const bruto = PUNTOS_POR_RAIZ_DE_MINUTO * Math.sqrt(minutos) * mult;
  return Math.min(PUNTOS_MAXIMOS, Math.max(PUNTOS_MINIMOS, Math.round(bruto)));
}

export const FACTOR_SOLO_REALIZADA = 0.8;

export interface OpcionesCalculoCompletado {
  generaPuntosYRecompensa: boolean;
  dificultad: Dificultad | null | undefined;
  tiempoEjecucionEstimadoSeg: number;
  newStreakDays?: number;
  isChecklist?: boolean;
  checklistCompletados?: number;
  isWeekend?: boolean;
  isHappyHour?: boolean;
  /** true si el usuario hizo clic en Iniciar, realizó la tarea y luego presionó Finalizar */
  fueIniciada: boolean;
  /** true si se completó dentro del horario previsto */
  esATiempo?: boolean;
}

export interface ResultadoCalculoCompletado {
  rewardPoints: number;
  basePoints: number;
  streakBonus: number;
  checklistBonus: number;
  timeBonus: number;
  porcentajeAplicado: 100 | 80 | 0;
  feedback: string;
}

/**
 * Calcula los puntos otorgados al completar una tarea:
 * - Si la persona hizo clic en Iniciar, realizó la tarea y presionó Finalizar (`fueIniciada = true`) -> 100% de los puntos.
 * - Si solo marca la tarea como realizada (sin iniciar / fuera de horario) (`fueIniciada = false`) -> 80% de los puntos.
 */
export function calcularPuntosCompletadoTarea(opts: OpcionesCalculoCompletado): ResultadoCalculoCompletado {
  if (!opts.generaPuntosYRecompensa) {
    return {
      rewardPoints: 0,
      basePoints: 0,
      streakBonus: 0,
      checklistBonus: 0,
      timeBonus: 0,
      porcentajeAplicado: 0,
      feedback: "Tarea marcada como realizada. No genera puntos.",
    };
  }

  const basePoints = puntosBase(opts.dificultad, opts.tiempoEjecucionEstimadoSeg);
  const streakDays = opts.newStreakDays ?? 1;
  const streakBonus = Math.max(0, Math.min(20, (streakDays - 1) * 2));
  const checklistBonus = opts.isChecklist ? Math.max(0, opts.checklistCompletados ?? 0) * 5 : 0;
  const timeBonus = opts.isWeekend || opts.isHappyHour ? 10 : 0;

  const bonusText: string[] = [];
  if (streakBonus > 0) bonusText.push(`${streakBonus} pts por racha`);
  if (checklistBonus > 0) bonusText.push(`${checklistBonus} pts por checklist`);
  if (timeBonus > 0) bonusText.push(`${timeBonus} pts por ${opts.isWeekend ? "fin de semana" : "Happy Hour"}`);
  const bonusString = bonusText.length > 0 ? ` Bonos: ${bonusText.join(", ")}.` : "";

  const totalPuntos = basePoints + streakBonus + checklistBonus + timeBonus;

  if (opts.fueIniciada) {
    return {
      rewardPoints: totalPuntos,
      basePoints,
      streakBonus,
      checklistBonus,
      timeBonus,
      porcentajeAplicado: 100,
      feedback: `¡Buen trabajo! Iniciaste y finalizaste la tarea (100% de los puntos). Obtuviste ${basePoints} pts base.${bonusString}`,
    };
  }

  const rewardPoints = Math.max(1, Math.round(totalPuntos * FACTOR_SOLO_REALIZADA));
  const detalleHorario = opts.esATiempo === false ? " y fuera de horario" : "";
  return {
    rewardPoints,
    basePoints,
    streakBonus,
    checklistBonus,
    timeBonus,
    porcentajeAplicado: 80,
    feedback: `Tarea marcada como realizada sin iniciar${detalleHorario} (80% de los puntos).${bonusString}`,
  };
}

