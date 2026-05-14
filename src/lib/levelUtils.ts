/**
 * Calcula el nivel, título y progreso del usuario basado en sus puntos acumulados.
 * Nivel = floor(sqrt(puntos / 100)) + 1
 */
export function getLevelInfo(puntosAcumulados: number) {
  const puntos = Math.max(0, puntosAcumulados);
  const currentLevel = Math.floor(Math.sqrt(puntos / 100)) + 1;

  const currentLevelPoints = Math.pow(currentLevel - 1, 2) * 100;
  const nextLevelPoints = Math.pow(currentLevel, 2) * 100;

  const pointsInCurrentLevel = puntos - currentLevelPoints;
  const pointsNeededForNext = nextLevelPoints - currentLevelPoints;
  const progressPercentage = Math.min(100, Math.max(0, Math.round((pointsInCurrentLevel / pointsNeededForNext) * 100)));

  let title = "Novato";
  if (currentLevel >= 15) title = "Héroe Legendario";
  else if (currentLevel >= 10) title = "Maestro de Tareas";
  else if (currentLevel >= 7) title = "Experto";
  else if (currentLevel >= 5) title = "Guerrero Disciplinado";
  else if (currentLevel >= 3) title = "Aprendiz Avanzado";
  else if (currentLevel >= 2) title = "Iniciado";

  return {
    level: currentLevel,
    title,
    currentPoints: puntos,
    nextLevelPoints,
    progressPercentage,
    pointsToNextLevel: nextLevelPoints - puntos
  };
}
