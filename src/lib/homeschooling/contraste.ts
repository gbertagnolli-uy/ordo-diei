// Contraste WCAG entre dos colores #rrggbb (para comprobar que los textos de Estudio cumplen AA). Puro.

const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);

function luminancia(hex: string): number {
  const [r, g, b] = [0, 1, 2].map((i) => {
    const v = canal(hex, i) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste WCAG (1 a 21). AA pide 4,5 para texto normal y 3 para texto grande. */
export function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Color de `frente` con opacidad `alfa` (0-1) sobre `fondo`: lo que se ve con clases como `bg-primary/10` */
export function mezclar(frente: string, fondo: string, alfa: number): string {
  const c = [0, 1, 2].map((i) => Math.round(canal(frente, i) * alfa + canal(fondo, i) * (1 - alfa)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
