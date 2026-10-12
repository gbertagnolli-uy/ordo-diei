// Puntos base de una tarea según su dificultad y su tiempo estimado.
// Diseño y tabla de ejemplos: vault/LANE_67_DIFICULTAD_RECOMPENSA.md

export const DIFICULTADES = ["Facil", "Media", "Dificil", "Ardua"] as const;
export type Dificultad = (typeof DIFICULTADES)[number];

export const DIFICULTAD_DEFAULT: Dificultad = "Media";

export const DIFICULTAD_INFO: Record<Dificultad, { etiqueta: string; multiplicador: number; ejemplo: string }> = {
  Facil: { etiqueta: "Fácil", multiplicador: 1, ejemplo: "Bañarse, hacer la cama" },
  Media: { etiqueta: "Media", multiplicador: 1.5, ejemplo: "Preparar el almuerzo" },
  Dificil: { etiqueta: "Difícil", multiplicador: 2.25, ejemplo: "Oraciones de la mañana" },
  Ardua: { etiqueta: "Ardua", multiplicador: 3, ejemplo: "Rosario completo" },
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
