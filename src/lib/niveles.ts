/**
 * Motor de niveles de Ordo Diei.
 *
 * Curva: nivel = floor(sqrt(xp / 100)) + 1
 * XP total = max(0, puntosAcumulados) + max(0, experienciaHabitos)
 *
 * Mantiene compatibilidad exacta con la curva original para que ningún
 * usuario existente baje de nivel.
 */

export interface NivelInfo {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number;
  progressPercentage: number;
  pointsToNextLevel: number;
}

export const TITULOS: { nivel: number; titulo: string }[] = [
  { nivel: 1, titulo: "Novato" },
  { nivel: 2, titulo: "Iniciado" },
  { nivel: 3, titulo: "Aprendiz avanzado" },
  { nivel: 5, titulo: "Guerrero disciplinado" },
  { nivel: 7, titulo: "Experto" },
  { nivel: 10, titulo: "Maestro de tareas" },
  { nivel: 15, titulo: "Héroe legendario" },
  { nivel: 20, titulo: "Columna de la familia" },
  { nivel: 25, titulo: "Ejemplo de virtud" },
  { nivel: 30, titulo: "Leyenda de Ordo Diei" },
];

/**
 * Devuelve el título correspondiente a un nivel dado.
 * Entre umbrales se mantiene el título alcanzado inmediatamente inferior.
 */
export function tituloDeNivel(level: number): string {
  const lvl = Math.max(1, Math.floor(level || 1));
  for (let i = TITULOS.length - 1; i >= 0; i--) {
    if (lvl >= TITULOS[i].nivel) {
      return TITULOS[i].titulo;
    }
  }
  return TITULOS[0].titulo;
}

/**
 * Calcula la suma de experiencia total de un usuario:
 * puntosAcumulados (tareas y bonos de hábitos de orden/cuidado) + experienciaHabitos (+10 por hábito registrado).
 */
export function xpTotal(u?: { puntosAcumulados?: number | null; experienciaHabitos?: number | null } | null): number {
  if (!u) return 0;
  const p = Math.max(0, u.puntosAcumulados ?? 0);
  const h = Math.max(0, u.experienciaHabitos ?? 0);
  return p + h;
}

/**
 * Calcula nivel, título y progreso a partir de los puntos de experiencia.
 */
export function nivelDe(xp: number): NivelInfo {
  const puntos = Math.max(0, Math.floor(xp || 0));
  const currentLevel = Math.floor(Math.sqrt(puntos / 100)) + 1;

  const currentLevelPoints = Math.pow(currentLevel - 1, 2) * 100;
  const nextLevelPoints = Math.pow(currentLevel, 2) * 100;

  const pointsInCurrentLevel = puntos - currentLevelPoints;
  const pointsNeededForNext = nextLevelPoints - currentLevelPoints;
  const progressPercentage =
    pointsNeededForNext > 0
      ? Math.min(100, Math.max(0, Math.round((pointsInCurrentLevel / pointsNeededForNext) * 100)))
      : 100;

  return {
    level: currentLevel,
    title: tituloDeNivel(currentLevel),
    currentPoints: puntos,
    nextLevelPoints,
    progressPercentage,
    pointsToNextLevel: Math.max(0, nextLevelPoints - puntos),
  };
}

/**
 * Alias retrocompatible para getLevelInfo(puntos)
 */
export const getLevelInfo = (xp: number): NivelInfo => nivelDe(xp);
