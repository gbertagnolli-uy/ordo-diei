// Diario (lane 296): reglas puras de los lugares frecuentes. Sin base de datos ni red, con tests.
// Portado de vendor/moodiary/packages/feature_base/moodiary_data/lib/src/place_repository.dart (`distanceMeters`, `PlaceMatching.matchAt`, `applyPlaceOrder`),
// de moodiary_models/lib/src/place.dart (`matchRadius`, `coordinateName`), de presentation/place/place_editor.dart (`kPlaceIcons`, `placeIconColor`)
// y de moodiary_platform/lib/src/location_service.dart (`LocationFailure`) (ZhuJHua/moodiary@2c552dd).
import type { Dueno } from "./etiquetas.ts";

export const MAX_LUGARES_AMBITO = 300;
export const MAX_NOMBRE_LUGAR = 80;

/** moodiary `Place.matchRadius`: un lugar «es el de acá» si queda a 200 m o menos. */
export const RADIO_COINCIDENCIA_M = 200;

/** moodiary `kPlaceIcons`, en el mismo orden. El primero es el de los lugares nuevos. */
export const ICONOS_LUGAR = ["house", "building-2", "school", "coffee", "dumbbell", "trees", "hospital", "plane"] as const;
export type IconoLugar = (typeof ICONOS_LUGAR)[number];
export const ICONO_LUGAR_INICIAL: IconoLugar = ICONOS_LUGAR[0];

export const ETIQUETA_ICONO_LUGAR: Record<IconoLugar, string> = {
  house: "Casa",
  "building-2": "Edificio",
  school: "Escuela",
  coffee: "Café",
  dumbbell: "Gimnasio",
  trees: "Parque",
  hospital: "Hospital",
  plane: "Viaje",
};

/** `kCategoryPalette` de moodiary (índices que usa `placeIconColor`). Un ícono desconocido no tiene color propio. */
const PALETA = ["#EF5350", "#EC407A", "#AB47BC", "#7E57C2", "#5C6BC0", "#42A5F5", "#26A69A", "#66BB6A", "#FFA726", "#8D6E63"] as const;
const COLOR_ICONO: Record<IconoLugar, string> = {
  house: PALETA[7],
  "building-2": PALETA[5],
  school: PALETA[2],
  coffee: PALETA[9],
  dumbbell: PALETA[8],
  trees: PALETA[6],
  hospital: PALETA[0],
  plane: PALETA[4],
};

export const esIconoLugar = (v: unknown): v is IconoLugar => typeof v === "string" && (ICONOS_LUGAR as readonly string[]).includes(v);

/** Color del lugar según su ícono, o null (se usa el color neutro del tema). */
export const colorDeIcono = (icono: string | null | undefined): string | null => (esIconoLugar(icono) ? COLOR_ICONO[icono] : null);

/** Blanco o negro, el que mejor se lee sobre el color (moodiary `onCategoryColor`: luminancia relativa > 0,5). */
export function colorSobre(hex: string): "#ffffff" | "#000000" {
  const n = Number.parseInt(hex.slice(1), 16);
  const canal = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
  return l > 0.5 ? "#000000" : "#ffffff";
}

// ── Distancia y coincidencia ────────────────────────────────────────────────

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

/** moodiary `distanceMeters`: Haversine con el radio medio de la Tierra de la IUGG (6 371 008,8 m). */
export function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const RADIO = 6_371_008.8;
  const aRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * aRad;
  const dLon = (lon2 - lon1) * aRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * aRad) * Math.cos(lat2 * aRad) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** moodiary `matchAt`: el lugar más cercano dentro del radio, o null. */
export function lugarCercano<T extends Coordenadas>(lugares: readonly T[], latitud: number, longitud: number, radio = RADIO_COINCIDENCIA_M): T | null {
  let mejor: T | null = null;
  let mejorDistancia = Number.POSITIVE_INFINITY;
  for (const l of lugares) {
    const d = distanciaMetros(latitud, longitud, l.latitud, l.longitud);
    if (d <= radio && d < mejorDistancia) {
      mejor = l;
      mejorDistancia = d;
    }
  }
  return mejor;
}

/** moodiary `formatDistance`: metros redondeados bajo 1 km, kilómetros con un decimal desde ahí. */
export function textoDistancia(metros: number): string {
  if (!Number.isFinite(metros) || metros < 0) return "";
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

/** moodiary `Place.coordinateName`: `lat, lon` con 4 decimales, para un lugar sin nombre. */
export const nombreDeCoordenadas = (latitud: number, longitud: number): string => `${latitud.toFixed(4)}, ${longitud.toFixed(4)}`;

/** moodiary `qweatherLocation`: la consulta externa va con 2 decimales (≈ 1 km), nunca con la posición exacta. */
export const redondearParaConsulta = (v: number): number => Number(v.toFixed(2));

/** Clave para comparar nombres de lugar: sin tildes, sin mayúsculas, espacios colapsados. */
export const claveDeNombre = (n: string): string =>
  n
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Lugares ordenados por distancia a un punto (el selector del editor, `placeRows` de diary_page). */
export function conDistancia<T extends Coordenadas>(lugares: readonly T[], punto: Coordenadas | null): (T & { metros: number | null })[] {
  const filas = lugares.map((l) => ({ ...l, metros: punto ? distanciaMetros(punto.latitud, punto.longitud, l.latitud, l.longitud) : null }));
  if (!punto) return filas;
  return filas.sort((a, b) => (a.metros ?? 0) - (b.metros ?? 0));
}

/** moodiary `applyPlaceOrder`: primero los de la lista, en ese orden; los que faltan, por id, al final. */
export function aplicarOrden<T extends { id: number }>(lugares: readonly T[], orden: readonly number[]): T[] {
  if (!orden.length) return [...lugares];
  const porId = new Map(lugares.map((l) => [l.id, l]));
  const salida: T[] = [];
  for (const id of orden) {
    const l = porId.get(id);
    if (l) {
      salida.push(l);
      porId.delete(id);
    }
  }
  return [...salida, ...[...porId.values()].sort((a, b) => a.id - b.id)];
}

// ── Validación ──────────────────────────────────────────────────────────────

/** Sin caracteres de control y con los espacios colapsados. Los lugares sí admiten comas y dos puntos («Montevideo, Pocitos»). */
export const limpiarNombreLugar = (v: unknown): string => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim() : "");

export interface LugarValido {
  nombre: string;
  latitud: number;
  longitud: number;
  icono: IconoLugar | null;
}

function coordenada(v: unknown, min: number, max: number, que: string): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : Number.NaN;
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${que} inválida`);
  return Number(n.toFixed(6));
}

export const validarLatitud = (v: unknown): number => coordenada(v, -90, 90, "La latitud");
export const validarLongitud = (v: unknown): number => coordenada(v, -180, 180, "La longitud");

export function validarLugar(b: Record<string, unknown>): LugarValido {
  const nombre = limpiarNombreLugar(b.nombre);
  if (!nombre) throw new Error("Poné un nombre");
  if (nombre.length > MAX_NOMBRE_LUGAR) throw new Error(`El nombre admite hasta ${MAX_NOMBRE_LUGAR} caracteres`);
  let icono: IconoLugar | null = null;
  if (b.icono !== null && b.icono !== undefined && b.icono !== "") {
    if (!esIconoLugar(b.icono)) throw new Error("Ícono inválido");
    icono = b.icono;
  }
  return { nombre, latitud: validarLatitud(b.latitud), longitud: validarLongitud(b.longitud), icono };
}

/** Identificador del lugar en una entrada: entero positivo, null = sin lugar, `undefined` = no se toca. */
export function validarLugarId(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "number" && Number.isInteger(v) && v > 0) return v;
  throw new Error("Lugar inválido");
}

/** Orden guardado: ids enteros, sin repetir. */
export function validarOrdenLugares(ids: unknown): number[] {
  if (!Array.isArray(ids) || ids.length > MAX_LUGARES_AMBITO || ids.some((i) => !Number.isInteger(i) || i <= 0) || new Set(ids).size !== ids.length) throw new Error("Orden inválido");
  return ids as number[];
}

// ── Exportar e importar (front matter de moodiary) ──────────────────────────

/** Lo que una entrada importada dice de su lugar: el nombre puede faltar (moodiary lo llama entonces `lat, lon`). */
export interface LugarImport {
  nombre: string | null;
  latitud: number;
  longitud: number;
}

/** moodiary `position: ["lat", "lon", "nombre"]`. */
export const lugarAFrontMatter = (l: { nombre: string; latitud: number; longitud: number }): [string, string, string] => [String(l.latitud), String(l.longitud), l.nombre];

const numero = (v: unknown): number | null => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.trim()) : null);

/** moodiary `_position`: lista `[lat, lon, nombre]` o mapa `{latitude|lat, longitude|lng|lon, name}`; fuera de rango o sin coordenadas, null. */
export function lugarDeFrontMatter(v: unknown): LugarImport | null {
  let lat: number | null = null;
  let lon: number | null = null;
  let nombre: unknown = null;
  if (Array.isArray(v)) {
    lat = numero(v[0]);
    lon = numero(v[1]);
    nombre = v[2];
  } else if (v && typeof v === "object") {
    const m = v as Record<string, unknown>;
    lat = numero(m.latitude ?? m.lat);
    lon = numero(m.longitude ?? m.lng ?? m.lon);
    nombre = m.name;
  } else return null;
  if (lat === null || lon === null || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const limpio = limpiarNombreLugar(nombre).slice(0, MAX_NOMBRE_LUGAR);
  return { nombre: limpio || null, latitud: lat, longitud: lon };
}

// ── Catálogo ────────────────────────────────────────────────────────────────

/** Mismo permiso que etiquetas y categorías (lane 284): personal = quien lo creó; familiar = quien lo creó o un padre. */
export type DuenoLugar = Dueno;

// ── Nombre a partir de la dirección (Nominatim) ─────────────────────────────

interface DireccionOsm {
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
}

/**
 * moodiary arma el nombre con `adm2 + name` (ciudad y distrito). Con OpenStreetMap: barrio y ciudad («Pocitos, Montevideo»);
 * si falta uno, el otro; si faltan los dos, null y el lugar se llama por sus coordenadas.
 */
export function nombreDeDireccion(d: unknown): string | null {
  if (!d || typeof d !== "object") return null;
  const a = d as DireccionOsm;
  const barrio = a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district;
  const ciudad = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? a.state;
  const partes = [barrio, ciudad].filter((p): p is string => typeof p === "string" && p.trim() !== "").map(limpiarNombreLugar);
  const unicas = partes.filter((p, i) => p && partes.indexOf(p) === i);
  const nombre = unicas.join(", ").slice(0, MAX_NOMBRE_LUGAR).trim();
  return nombre || null;
}

// ── Ubicación del dispositivo ───────────────────────────────────────────────

/** moodiary `LocationFailure`. */
export type FalloUbicacion = "permisoDenegado" | "servicioApagado" | "noDisponible";

export const TEXTO_FALLO_UBICACION: Record<FalloUbicacion, string> = {
  permisoDenegado: "No hay permiso para usar la ubicación. Activalo en los ajustes del navegador.",
  servicioApagado: "La ubicación del dispositivo está apagada.",
  noDisponible: "No se pudo obtener la ubicación.",
};

/** Traduce el código del error de `navigator.geolocation` (1 permiso, 2 sin posición, 3 tiempo). */
export function falloDeGeolocalizacion(codigo: number): FalloUbicacion {
  if (codigo === 1) return "permisoDenegado";
  if (codigo === 2) return "servicioApagado";
  return "noDisponible";
}
