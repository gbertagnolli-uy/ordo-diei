// Día con sanción (vault/LANE_200_SANCION_Y_ENGAGEMENT.md): si un padre registra un comportamiento
// negativo, ese día el niño pierde sus beneficios. Módulo puro: las reglas y los textos, sin base de datos.
import type { ItemPremio } from "./premios.ts";

/** Todo lo que se gana en un día con sanción vale la mitad (puntos, XP, estrellas e incienso), redondeado hacia abajo */
export const mitad = (n: number) => Math.floor(Math.max(0, n) / 2);

export type Bloqueo = "tienda" | "cartas" | "cofre";

export const MENSAJE_BLOQUEO: Record<Bloqueo, { titulo: string; texto: string }> = {
  tienda: {
    titulo: "La tienda está deshabilitada por hoy",
    texto: "Por mal comportamiento, la tienda queda deshabilitada por 1 día. Volvé mañana.",
  },
  cartas: {
    titulo: "Las cartas están deshabilitadas por hoy",
    texto: "Por mal comportamiento, las cartas quedan deshabilitadas por 1 día. Volvé mañana.",
  },
  cofre: {
    titulo: "Hoy te perdiste el cofre",
    texto: "Hoy te perdiste el cofre por mal comportamiento. Volvé mañana.",
  },
};

export const AVISO_MITAD = "Hoy lo que ganás vale la mitad por mal comportamiento.";

/** Mensaje de error cuando se intenta una acción bloqueada (llega tal cual al usuario) */
export const errorBloqueo = (que: Bloqueo) => MENSAJE_BLOQUEO[que].texto;

/**
 * Lo que realmente se acredita al abrir un premio en un día con sanción: puntos, XP e incienso a la mitad.
 * Los ítems que se quedan en cero desaparecen. Las cartas no entran: el premio con cartas no se abre ese día.
 */
export function premioConSancion(items: ItemPremio[]): ItemPremio[] {
  const salida: ItemPremio[] = [];
  for (const i of items) {
    if (i.tipo === "puntos" || i.tipo === "xp" || i.tipo === "incienso") {
      const cantidad = mitad(i.cantidad);
      if (cantidad > 0) salida.push({ ...i, cantidad });
    } else {
      salida.push(i);
    }
  }
  return salida;
}

export const tieneCartas = (items: ItemPremio[]) => items.some((i) => i.tipo === "carta");
