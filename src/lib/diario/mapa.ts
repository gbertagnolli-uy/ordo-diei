// Diario (lane 297): matemática del mapa — proyección Web Mercator, baldosas visibles, ajustar la vista a varios puntos, zoom alrededor de un punto y tamaño de los pines.
// Reemplaza lo que en moodiary hace `flutter_map` (vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/map/map_page.dart, ZhuJHua/moodiary@2c552dd):
// `CameraFit.coordinates` (margen y zoom máximo), `_FootprintPin` (tamaños), `MapOptions` (zoom 3–18) y `CircleMarker(useRadiusInMeter)`. Módulo puro: sin React ni DOM.
import type { Coordenadas } from "./lugares.ts";

/** Lado de una baldosa en píxeles, en su zoom nativo. */
export const TAM_BALDOSA = 256;
/** moodiary `MapOptions(minZoom: 3, maxZoom: 18)`. */
export const ZOOM_MIN = 3;
export const ZOOM_MAX = 18;
/** OpenStreetMap publica baldosas hasta el zoom 19 (`maxNativeZoom`). */
export const ZOOM_NATIVO_MAX = 19;
/** moodiary `_kFitMaxZoom`: al ajustar a varios puntos no se acerca más que esto. */
export const ZOOM_AJUSTE_MAX = 13;
/** moodiary `_kFocusZoom`: al tocar un lugar se acerca al menos hasta acá. */
export const ZOOM_ENFOQUE = 14;
/** moodiary `_kEditorZoom`: el zoom del mapa del editor de lugar. */
export const ZOOM_EDITOR = 16;
/** moodiary `_kCardInset` / margen de `_cardOverview`. */
export const MARGEN_TARJETA = 36;
/** Límite de latitud de Web Mercator. */
export const LATITUD_MAX = 85.0511287798;
/** Radio ecuatorial usado por Web Mercator (m). */
const RADIO_MERCATOR = 6_378_137;
const A_RAD = Math.PI / 180;

/** URL de una baldosa de OpenStreetMap (única fuente; ver la decisión D2 de la lane 297). */
export const baldosaUrl = (z: number, x: number, y: number): string => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

export interface Camara {
  latitud: number;
  longitud: number;
  /** Puede ser fraccional. */
  zoom: number;
}

export interface Tamano {
  ancho: number;
  alto: number;
}

export interface Relleno {
  arriba: number;
  derecha: number;
  abajo: number;
  izquierda: number;
}

export const rellenoUniforme = (v: number): Relleno => ({ arriba: v, derecha: v, abajo: v, izquierda: v });

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Largo del mundo en píxeles a ese zoom. */
export const tamanoMundo = (zoom: number): number => TAM_BALDOSA * 2 ** zoom;

/** Coordenadas → píxel del mundo (origen arriba a la izquierda, a ese zoom). */
export function aPixelMundo(latitud: number, longitud: number, zoom: number): { x: number; y: number } {
  const mundo = tamanoMundo(zoom);
  const lat = limitar(latitud, -LATITUD_MAX, LATITUD_MAX);
  const seno = Math.sin(lat * A_RAD);
  return {
    x: ((longitud + 180) / 360) * mundo,
    y: (0.5 - Math.log((1 + seno) / (1 - seno)) / (4 * Math.PI)) * mundo,
  };
}

/** Píxel del mundo → coordenadas. */
export function dePixelMundo(x: number, y: number, zoom: number): Coordenadas {
  const mundo = tamanoMundo(zoom);
  const n = Math.PI - (2 * Math.PI * y) / mundo;
  return { latitud: (Math.atan(Math.sinh(n)) * 180) / Math.PI, longitud: (x / mundo) * 360 - 180 };
}

/** Deja la cámara dentro de lo que el mapa admite: zoom 3–18, latitud de Mercator y longitud entre -180 y 180. */
export function limitarCamara(c: Camara): Camara {
  let longitud = ((((c.longitud + 180) % 360) + 360) % 360) - 180;
  if (c.longitud === 180) longitud = 180;
  return { latitud: limitar(c.latitud, -LATITUD_MAX, LATITUD_MAX), longitud, zoom: limitar(c.zoom, ZOOM_MIN, ZOOM_MAX) };
}

/** Píxel (dentro del contenedor, origen arriba a la izquierda) donde cae un punto con esa cámara. */
export function aPantalla(c: Camara, t: Tamano, latitud: number, longitud: number): { x: number; y: number } {
  const centro = aPixelMundo(c.latitud, c.longitud, c.zoom);
  const p = aPixelMundo(latitud, longitud, c.zoom);
  // El mundo se repite en horizontal: se elige la copia más cercana al centro
  const mundo = tamanoMundo(c.zoom);
  let dx = p.x - centro.x;
  if (dx > mundo / 2) dx -= mundo;
  else if (dx < -mundo / 2) dx += mundo;
  return { x: t.ancho / 2 + dx, y: t.alto / 2 + (p.y - centro.y) };
}

/** Lo inverso de `aPantalla`: las coordenadas que hay bajo un píxel del contenedor. */
export function dePantalla(c: Camara, t: Tamano, x: number, y: number): Coordenadas {
  const centro = aPixelMundo(c.latitud, c.longitud, c.zoom);
  return dePixelMundo(centro.x + (x - t.ancho / 2), centro.y + (y - t.alto / 2), c.zoom);
}

export interface Baldosa {
  /** Zoom de la baldosa (entero). */
  z: number;
  /** Columna y fila ya envueltas (0 … 2^z - 1), para la URL. */
  x: number;
  y: number;
  /** Columna sin envolver (distinta en cada copia del mundo): sirve de clave. */
  col: number;
  /** Posición dentro del contenedor, en píxeles. */
  izquierda: number;
  arriba: number;
  /** Lado en píxeles (la baldosa se escala si el zoom es fraccional). */
  lado: number;
}

/** Baldosas que cubren el contenedor. El zoom de las baldosas es el entero más cercano; el resto se resuelve escalando (moodiary / `flutter_map` hacen lo mismo). */
export function baldosasVisibles(c: Camara, t: Tamano): Baldosa[] {
  const z = limitar(Math.round(c.zoom), 0, ZOOM_NATIVO_MAX);
  const escala = 2 ** (c.zoom - z);
  const lado = TAM_BALDOSA * escala;
  const centro = aPixelMundo(c.latitud, c.longitud, z);
  const izq = centro.x - t.ancho / (2 * escala);
  const arr = centro.y - t.alto / (2 * escala);
  const der = centro.x + t.ancho / (2 * escala);
  const aba = centro.y + t.alto / (2 * escala);
  const cuantas = 2 ** z;
  const x0 = Math.floor(izq / TAM_BALDOSA);
  const x1 = Math.floor(der / TAM_BALDOSA);
  const y0 = Math.max(0, Math.floor(arr / TAM_BALDOSA));
  const y1 = Math.min(cuantas - 1, Math.floor(aba / TAM_BALDOSA));
  const salida: Baldosa[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      salida.push({
        z,
        x: ((x % cuantas) + cuantas) % cuantas,
        y,
        col: x,
        izquierda: (x * TAM_BALDOSA - izq) * escala,
        arriba: (y * TAM_BALDOSA - arr) * escala,
        lado,
      });
    }
  }
  return salida;
}

/**
 * moodiary `CameraFit.coordinates`: el centro y el zoom que dejan todos los puntos dentro del contenedor, con ese margen, sin pasar de `zoomMax`.
 * Con un solo punto (o varios en el mismo lugar), se centra en él con `zoomMax`. Sin puntos, null.
 */
export function ajustarVista(puntos: readonly Coordenadas[], t: Tamano, relleno: Relleno, zoomMax = ZOOM_AJUSTE_MAX, zoomMin = ZOOM_MIN): Camara | null {
  if (!puntos.length) return null;
  // En el zoom 0 el mundo mide 256 px: ahí se mide el rectángulo y se busca cuánto se lo puede agrandar
  const mundos = puntos.map((p) => aPixelMundo(p.latitud, p.longitud, 0));
  const minX = Math.min(...mundos.map((m) => m.x));
  const maxX = Math.max(...mundos.map((m) => m.x));
  const minY = Math.min(...mundos.map((m) => m.y));
  const maxY = Math.max(...mundos.map((m) => m.y));
  const disponibleAncho = Math.max(1, t.ancho - relleno.izquierda - relleno.derecha);
  const disponibleAlto = Math.max(1, t.alto - relleno.arriba - relleno.abajo);
  const anchoUnidad = maxX - minX;
  const altoUnidad = maxY - minY;
  const zx = anchoUnidad > 0 ? Math.log2(disponibleAncho / anchoUnidad) : Number.POSITIVE_INFINITY;
  const zy = altoUnidad > 0 ? Math.log2(disponibleAlto / altoUnidad) : Number.POSITIVE_INFINITY;
  const zoom = limitar(Math.min(zx, zy, zoomMax), zoomMin, ZOOM_MAX);
  // El rectángulo no queda centrado en el contenedor si el margen es desparejo: se corre el centro
  const escala = 2 ** zoom;
  const cx = ((minX + maxX) / 2) * escala + (relleno.derecha - relleno.izquierda) / 2;
  const cy = ((minY + maxY) / 2) * escala + (relleno.abajo - relleno.arriba) / 2;
  const centro = dePixelMundo(cx / escala, cy / escala, 0);
  return limitarCamara({ latitud: centro.latitud, longitud: centro.longitud, zoom });
}

/** Arrastre: el mapa se mueve `dx`, `dy` píxeles con el dedo, o sea que el centro va para el otro lado. */
export function moverPorPixeles(c: Camara, dx: number, dy: number): Camara {
  const centro = aPixelMundo(c.latitud, c.longitud, c.zoom);
  const nuevo = dePixelMundo(centro.x - dx, centro.y - dy, c.zoom);
  return limitarCamara({ ...c, latitud: nuevo.latitud, longitud: nuevo.longitud });
}

/** Cambia el zoom dejando fijo el punto que está bajo el píxel `(px, py)` (rueda, pellizco y doble clic). */
export function acercarEn(c: Camara, t: Tamano, px: number, py: number, zoom: number): Camara {
  const nuevoZoom = limitar(zoom, ZOOM_MIN, ZOOM_MAX);
  const bajo = dePantalla(c, t, px, py);
  const fijo = aPixelMundo(bajo.latitud, bajo.longitud, nuevoZoom);
  const centro = dePixelMundo(fijo.x - (px - t.ancho / 2), fijo.y - (py - t.alto / 2), nuevoZoom);
  return limitarCamara({ latitud: centro.latitud, longitud: centro.longitud, zoom: nuevoZoom });
}

/** Metros por píxel en esa latitud y zoom (Web Mercator, baldosas de 256 px). */
export const metrosPorPixel = (latitud: number, zoom: number): number => (2 * Math.PI * RADIO_MERCATOR * Math.cos(latitud * A_RAD)) / tamanoMundo(zoom);

/** moodiary `CircleMarker(useRadiusInMeter: true)`: el radio de un círculo en metros, en píxeles. */
export const metrosAPixeles = (metros: number, latitud: number, zoom: number): number => metros / metrosPorPixel(latitud, zoom);

/** moodiary `_FootprintPin`: 38 px elegido, 14 px una sola entrada, 26 px hasta 9, 30 px desde 10. */
export function tamanoPin(cantidad: number, elegido: boolean): number {
  if (elegido) return 38;
  if (cantidad === 1) return 14;
  return cantidad < 10 ? 26 : 30;
}

/** El número dentro del pin: ninguno si es una sola entrada y no está elegido; `99+` desde 100. */
export function textoPin(cantidad: number, elegido: boolean): string {
  if (cantidad === 1 && !elegido) return "";
  return cantidad > 99 ? "99+" : String(cantidad);
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

/** «mar 2025» a partir de «2025-03-17». */
export function mesAnio(fecha: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(fecha);
  if (!m) return fecha;
  return `${MESES[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/** moodiary `_range`: «mar 2025», o «mar 2025 – may 2025» si empieza y termina en meses distintos. */
export function rangoDeMeses(primera: string, ultima: string): string {
  const a = mesAnio(primera);
  const b = mesAnio(ultima);
  return a === b ? a : `${a} – ${b}`;
}

/** moodiary `timelineMonthCount`: «1 entrada» / «N entradas». */
export const textoCantidad = (n: number): string => (n === 1 ? "1 entrada" : `${n} entradas`);

/** La lista del mapa: más entradas primero (moodiary la ordena por `count`); si empatan, la más reciente y después el id. */
export function ordenarHuellas<T extends { lugarId: number; cantidad: number; ultima: string }>(huellas: readonly T[]): T[] {
  return [...huellas].sort((a, b) => b.cantidad - a.cantidad || b.ultima.localeCompare(a.ultima) || a.lugarId - b.lugarId);
}

// ── Animación de la cámara ──────────────────────────────────────────────────

/** Interpolación lineal de la cámara (la longitud toma el camino corto). */
export function interpolarCamara(a: Camara, b: Camara, t: number): Camara {
  let dLon = b.longitud - a.longitud;
  if (dLon > 180) dLon -= 360;
  else if (dLon < -180) dLon += 360;
  return limitarCamara({ latitud: a.latitud + (b.latitud - a.latitud) * t, longitud: a.longitud + dLon * t, zoom: a.zoom + (b.zoom - a.zoom) * t });
}

/**
 * `Easing.emphasizedDecelerate` de Material 3: curva Bézier cúbica (0,05; 0,7; 0,1; 1). Es la que usa moodiary para mover la cámara.
 * `t` entre 0 y 1 → avance entre 0 y 1.
 */
export function curvaDesaceleracion(t: number): number {
  const [x1, y1, x2, y2] = [0.05, 0.7, 0.1, 1];
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const bez = (a: number, b: number, s: number) => 3 * a * (1 - s) ** 2 * s + 3 * b * (1 - s) * s ** 2 + s ** 3;
  // Se busca el parámetro s cuya x vale t (bisección: la curva es monótona)
  let bajo = 0;
  let alto = 1;
  for (let i = 0; i < 24; i++) {
    const medio = (bajo + alto) / 2;
    if (bez(x1, x2, medio) < t) bajo = medio;
    else alto = medio;
  }
  return bez(y1, y2, (bajo + alto) / 2);
}
