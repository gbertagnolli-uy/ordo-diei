export function calculateLevel(puntosAcumulados: number): { level: number, title: string } {
  const points = puntosAcumulados || 0;
  // Ex: 1 level every 100 points
  const level = Math.floor(points / 100) + 1;

  let title = "Novato";
  if (level >= 5) title = "Aprendiz";
  if (level >= 10) title = "Aventurero";
  if (level >= 20) title = "Guerrero";
  if (level >= 35) title = "Maestro";
  if (level >= 50) title = "Leyenda";

  return { level, title };
}

export function calculateLevelProgress(puntosAcumulados: number): number {
  const points = puntosAcumulados || 0;
  // Progress within the current 100 point bracket
  const remainder = points % 100;
  return remainder; // since bracket is exactly 100, remainder is percentage
}
