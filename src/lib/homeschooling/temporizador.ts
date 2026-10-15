// Reloj visual de una lección (Primero/Después) y cronómetro de actividades. Puro: el tiempo lo lleva el componente.

export type FaseTiempo = "verde" | "ambar" | "rojo";

/** Fracción de tiempo que queda (0-1) → color: verde hasta la mitad, ámbar hasta el 20 % y rojo después */
export function faseDe(ratioRestante: number): FaseTiempo {
  if (ratioRestante > 0.5) return "verde";
  if (ratioRestante > 0.2) return "ambar";
  return "rojo";
}

export function segundosRestantes(totalSeg: number, transcurridoSeg: number): number {
  return Math.max(0, Math.round(totalSeg - transcurridoSeg));
}

/** 75 → «01:15»; 3725 → «1:02:05» */
export function formatoReloj(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const dos = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${dos(m)}:${dos(s % 60)}` : `${dos(m)}:${dos(s % 60)}`;
}

/** Longitud del arco que queda en un círculo de radio `r` (para `stroke-dasharray`) */
export function arco(ratioRestante: number, r: number): { largo: number; total: number } {
  const total = 2 * Math.PI * r;
  return { largo: total * Math.min(1, Math.max(0, ratioRestante)), total };
}
