// Colores litúrgicos (SPEC liturgia §9.3). DO entrega `liturgical_color` y el generador lo guarda
// ya traducido a estos cinco valores (ver `ColorLiturgico`).
import type { ColorLiturgico } from "./tipos.ts";

export type InfoColor = {
  etiqueta: string;
  /** Color del punto/chip. */
  hex: string;
  /** Borde del punto: el blanco y el negro necesitan contorno para verse sobre el fondo. */
  borde: string;
};

export const COLORES_LITURGICOS: Record<ColorLiturgico, InfoColor> = {
  blanco: { etiqueta: "Blanco", hex: "#ffffff", borde: "#b8962e" },
  rojo: { etiqueta: "Rojo", hex: "#b91c1c", borde: "#b91c1c" },
  verde: { etiqueta: "Verde", hex: "#15803d", borde: "#15803d" },
  morado: { etiqueta: "Morado", hex: "#6b21a8", borde: "#6b21a8" },
  negro: { etiqueta: "Negro", hex: "#1c1917", borde: "#78716c" },
};

/** Tolera valores inesperados de la base: cae en blanco antes que romper la pantalla. */
export function infoColor(color: string | null | undefined): InfoColor {
  return COLORES_LITURGICOS[color as ColorLiturgico] ?? COLORES_LITURGICOS.blanco;
}

export const ETIQUETAS_TIEMPO: Record<string, string> = {
  adviento: "Adviento",
  navidad: "Navidad",
  epifania: "Epifanía",
  septuagesima: "Septuagésima",
  cuaresma: "Cuaresma",
  pasion: "Pasión",
  pascua: "Pascua",
  pentecostes: "Después de Pentecostés",
};
