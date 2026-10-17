// Hitos de la racha de días en la app (vault/ENGAGEMENT_PLAN.md): un premio sorpresa al llegar a cada uno.
// Los premios son chicos a propósito: ~20 puntos por día es lo que ganan los chicos con sus tareas.
export type Hito = { dias: number; titulo: string; puntos: number; xp: number; fragmentos: number };

export const HITOS_RACHA: Hito[] = [
  { dias: 3, titulo: "3 días en la app", puntos: 10, xp: 30, fragmentos: 1 },
  { dias: 7, titulo: "Una semana en la app", puntos: 25, xp: 80, fragmentos: 2 },
  { dias: 14, titulo: "Dos semanas en la app", puntos: 40, xp: 150, fragmentos: 3 },
  { dias: 30, titulo: "Un mes en la app", puntos: 80, xp: 300, fragmentos: 5 },
  { dias: 60, titulo: "Dos meses en la app", puntos: 120, xp: 500, fragmentos: 8 },
  { dias: 100, titulo: "100 días en la app", puntos: 200, xp: 800, fragmentos: 12 },
  { dias: 200, titulo: "200 días en la app", puntos: 300, xp: 1200, fragmentos: 18 },
  { dias: 365, titulo: "Un año en la app", puntos: 500, xp: 2000, fragmentos: 30 },
];

/** Hitos que una racha de `dias` ya alcanzó */
export const hitosAlcanzados = (dias: number) => HITOS_RACHA.filter((h) => h.dias <= dias);

/** Próximo hito (null si ya pasó el último) */
export const proximoHito = (dias: number) => HITOS_RACHA.find((h) => h.dias > dias) ?? null;

/** Identifica el premio de un hito dentro de una racha, para no entregarlo dos veces */
export const origenHito = (h: Hito, inicioRacha: string) => `Racha en la app · ${h.dias} días · desde ${inicioRacha}`;
