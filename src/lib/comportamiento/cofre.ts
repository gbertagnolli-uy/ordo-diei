// Cofre sorpresa diario (vault/LANE_85_COFRE_Y_MIS_PREMIOS.md): premio chico por portarse bien,
// pensado para poder llegar todos los días. Portarse bien tiene que valer más, en la mente del
// niño, que cumplir una tarea: por eso el XP de un cofre supera a lo que da una tarea promedio.
import type { RarezaCarta } from "../cartas/economia.ts";
import type { ItemPremio } from "./premios.ts";

export const HORA_COFRE = 18; // el cofre llega desde las 18:00 (hora de la familia)
export const COFRE_PUNTOS = 10;
export const COFRE_XP = 50;
export const COFRE_FRAGMENTOS = 1;

/** Probabilidad (en %) de la rareza de la carta del fragmento; suman 100 */
export const PESOS_RAREZA_COFRE: Record<RarezaCarta, number> = { Comun: 60, Buena: 28, Perfecta: 10, Celestial: 2 };

/**
 * Un día cuenta como bueno cuando los padres registraron más comportamientos positivos que
 * negativos. Sin ningún registro positivo no hay cofre: lo tienen que evaluar los padres.
 */
export const diaEsBueno = (positivos: number, negativos: number) => positivos > 0 && positivos > negativos;

export function elegirRareza(azar: number = Math.random()): RarezaCarta {
  let acumulado = 0;
  for (const [rareza, peso] of Object.entries(PESOS_RAREZA_COFRE) as [RarezaCarta, number][]) {
    acumulado += peso;
    if (azar * 100 < acumulado) return rareza;
  }
  return "Comun";
}

export function contenidoCofre(carta: { id: number; nombre: string }): ItemPremio[] {
  return [
    { tipo: "puntos", cantidad: COFRE_PUNTOS },
    { tipo: "xp", cantidad: COFRE_XP },
    { tipo: "carta", cartaId: carta.id, nombre: carta.nombre, modo: "fragmentos", cantidad: COFRE_FRAGMENTOS },
  ];
}
