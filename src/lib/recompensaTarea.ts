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
