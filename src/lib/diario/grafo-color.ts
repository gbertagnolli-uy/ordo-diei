// Diario (lane 295): cuentas de color del grafo. Sin DOM: la paleta del tema se lee en components/diario/grafo/paleta.ts y llega acá ya como números.
// Portado de `_resolveColors`, `GraphPalette.dim` y `dimEdge` (vendor/moodiary/.../presentation/graph/graph_scene.dart y graph_style.dart, ZhuJHua/moodiary@2c552dd).

/** Rojo, verde y azul de 0 a 255, y opacidad de 0 a 1. */
export type Rgba = [number, number, number, number];

const acotar = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
const redondear = (v: number): number => Math.round(acotar(v, 0, 255));

/** Lee los formatos que devuelve `getComputedStyle`: `#rrggbb`, `#rgb`, `rgb()`/`rgba()` (con comas o espacios) y `color(srgb r g b / a)`. */
export function leerColor(texto: string): Rgba | null {
  const t = texto.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(t);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const numero = (s: string | undefined, escala = 1): number => {
    if (s === undefined) return NaN;
    return s.endsWith("%") ? (parseFloat(s) / 100) * escala : parseFloat(s);
  };
  const funcion = /^(rgba?|color)\(\s*(?:srgb\s+)?([^)]*)\)$/.exec(t);
  if (!funcion) return null;
  const [canales, alfa] = funcion[2].split("/").map((x) => x.trim());
  const partes = canales.split(/[\s,]+/).filter(Boolean);
  if (funcion[1] === "color") {
    if (!/^color\(\s*srgb\s/.test(t)) return null;
    const [r, g, b] = partes.slice(0, 3).map((p) => numero(p, 1) * 255);
    const a = alfa === undefined ? 1 : numero(alfa, 1);
    return [r, g, b].every(Number.isFinite) ? [redondear(r), redondear(g), redondear(b), acotar(Number.isFinite(a) ? a : 1, 0, 1)] : null;
  }
  const [r, g, b] = partes.slice(0, 3).map((p) => numero(p, 255));
  // `rgba(r, g, b, a)` trae la opacidad como cuarta parte, `rgb(r g b / a)` después de la barra
  const a = alfa !== undefined ? numero(alfa, 1) : partes[3] !== undefined ? numero(partes[3], 1) : 1;
  return [r, g, b].every(Number.isFinite) ? [redondear(r), redondear(g), redondear(b), acotar(Number.isFinite(a) ? a : 1, 0, 1)] : null;
}

/** Para `ctx.fillStyle` y `strokeStyle`. */
export const colorCss = (c: Rgba, alfa: number = c[3]): string => `rgba(${c[0]},${c[1]},${c[2]},${Math.round(acotar(alfa, 0, 1) * 1000) / 1000})`;

/** `Color.lerp` de Flutter: mezcla canal por canal, también la opacidad. */
export const mezclar = (a: Rgba, b: Rgba, t: number): Rgba => [redondear(a[0] + (b[0] - a[0]) * t), redondear(a[1] + (b[1] - a[1]) * t), redondear(a[2] + (b[2] - a[2]) * t), a[3] + (b[3] - a[3]) * t];

/** [matiz 0–360, saturación 0–1, luminosidad 0–1]. */
export function aHsl([r, g, b]: Rgba): [number, number, number] {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === rr ? ((gg - bb) / d) % 6 : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

export function desdeHsl(h: number, s: number, l: number, alfa = 1): Rgba {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [redondear((r + m) * 255), redondear((g + m) * 255), redondear((b + m) * 255), alfa];
}

/** El mismo color con otra luminosidad (`HSLColor.withLightness`). */
export function conLuminosidad(c: Rgba, l: number): Rgba {
  const [h, s] = aHsl(c);
  return desdeHsl(h, s, acotar(l, 0, 1), c[3]);
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Colorear por fecha: `t` = 0 la más antigua, 1 la más nueva. Con tema oscuro lo nuevo es más claro; con tema claro, más oscuro (más intenso). */
export const colorPorFecha = (base: Rgba, t: number, oscuro: boolean): Rgba => conLuminosidad(base, oscuro ? lerp(0.42, 0.78, t) : lerp(0.72, 0.42, t));

/** `categoryColorOf`: el color elegido de la categoría o, sin él, uno estable derivado del id. */
export function colorDeCategoria(color: string | null | undefined, id: number): Rgba {
  const elegido = color ? leerColor(color) : null;
  if (elegido) return elegido;
  return desdeHsl((Math.abs(id) * 137.508) % 360, 0.55, 0.52);
}

/** `GraphPalette.dim`: el color de lo que queda atrás mientras hay un nodo elegido. */
export const atenuar = (c: Rgba, oscuro: boolean): Rgba => [c[0], c[1], c[2], oscuro ? 0.22 : 0.2];

/** `GraphPalette.dimEdge`. */
export const atenuarArista = (c: Rgba): Rgba => [c[0], c[1], c[2], Math.max(0.045, c[3] * 0.25)];
