// Diario (lane 288): reglas puras de las vistas de calendario — mes con portada, ánimo y contador, vista anual con mapa de calor y selector de mes.
// Sin base ni red, con tests. Las fechas son claves "YYYY-MM-DD" (la zona de la familia ya viene aplicada) y los meses "YYYY-MM".
// Portado de vendor/Daily_You/lib/widgets/{vertical_calendar,entry_day_cell,year_month_picker,calendar_view_options_dialog}.dart y lib/utils/year_month_range.dart
// (Demizo/Daily_You@7cc237d): celda con portada, ánimo, contador de entradas y etiqueta superpuesta, opciones del calendario y rango del selector de mes.
// De vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/calendar/calendar_page.dart, packages/foundation/mui/lib/src/components/common/heatmap.dart
// y packages/feature_base/moodiary_data/lib/src/dashboard_controller.dart (ZhuJHua/moodiary@2c552dd): grilla fija de seis filas, vista anual de doce meses,
// mapa de calor con niveles por cuartiles de palabras, elección del día al cambiar de mes y cuenta de entradas por período.
// De vendor/storypad/lib/views/{calendar/mood,home/years} (theachoem/storypad@a76825e): filtro por etiqueta del calendario y lista de años con su cantidad de entradas.
import { sumarDias } from "./busqueda.ts";
import { imagenesDe, type NodoDoc } from "./contenido.ts";
import { diaSemana, diasEntre, type FilaEstadistica } from "./estadisticas.ts";

// ── Meses ────────────────────────────────────────────────────────────────────

const RE_MES = /^\d{4}-\d{2}$/;
export const esMes = (v: unknown): v is string => typeof v === "string" && RE_MES.test(v) && Number(v.slice(5)) >= 1 && Number(v.slice(5)) <= 12;

/** Suma `n` meses a "YYYY-MM". */
export function moverMes(mes: string, n: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${String(d.getUTCFullYear()).padStart(4, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const diasDelMes = (mes: string): number => {
  const [y, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/** moodiary `monthGeometry`, con la semana desde el lunes (decisión E2 de la lane 287): huecos antes del día 1 y días del mes. */
export function geometriaMes(mes: string): { huecos: number; dias: number } {
  return { huecos: diaSemana(`${mes}-01`), dias: diasDelMes(mes) };
}

export const fechasDelMes = (mes: string): string[] => Array.from({ length: diasDelMes(mes) }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`);

/** Filas de la grilla de un mes (moodiary `_kGridRows`): siempre seis, así al cambiar de mes la lista de abajo no salta. */
export const FILAS_MES = 6;

/** Las 42 celdas del mes: `null` = hueco antes del día 1 o después del último. */
export function celdasDelMes(mes: string): (string | null)[] {
  const { huecos } = geometriaMes(mes);
  const fechas = fechasDelMes(mes);
  return [...Array<null>(huecos).fill(null), ...fechas, ...Array<null>(Math.max(0, FILAS_MES * 7 - huecos - fechas.length)).fill(null)];
}

/**
 * moodiary `_pickDayIn`: al pasar de un mes a otro se queda en el mismo número de día (acotado al largo del mes).
 * Si ya se sabe qué días tienen entradas y ese no tiene pero otro sí, va al primero con entradas. Nunca un día futuro.
 */
export function elegirDia(mes: string, diaActual: number, hoy: string, conEntradas: ReadonlySet<string> | null = null): string {
  const mismoDia = `${mes}-${String(Math.min(Math.max(diaActual, 1), diasDelMes(mes))).padStart(2, "0")}`;
  let elegido = mismoDia;
  if (conEntradas && !conEntradas.has(mismoDia)) elegido = fechasDelMes(mes).find((f) => conEntradas.has(f)) ?? mismoDia;
  if (elegido > hoy) return mes === hoy.slice(0, 7) ? hoy : `${mes}-01`;
  return elegido;
}

// ── Resumen de cada día del mes ──────────────────────────────────────────────

/** Lo que el calendario necesita de una entrada (la `EntradaVista` del servidor lo cumple). */
export interface EntradaDeCalendario {
  id: number;
  fecha: string;
  hora: number;
  creadaEn: string;
  animo: number | null;
  titulo: string | null;
  texto: string;
  contenido: NodoDoc | null;
  fotos: string[];
  categoriaId: number | null;
  etiquetas: { id: number; valor: string | null }[];
}

export interface DiaCalendario {
  cantidad: number;
  /** Ánimo del día: el de la última entrada con ánimo (como el resumen del mes). */
  animo: number | null;
  /** Primera foto de la entrada más reciente que tenga alguna (adjunta o dentro del documento): Daily You `getCoverCandidatesForEntry`. */
  portada: string | null;
  /** Categoría y título de la primera entrada escrita ese día (moodiary `_dayOf`). */
  categoriaId: number | null;
  titulo: string;
  /** Etiqueta superpuesta (Daily You `calendarTagOverlay`): su valor en la primera entrada del día que la tiene. `null` = ninguna la tiene. */
  etiqueta: { valor: string | null } | null;
}

const masNueva = (a: EntradaDeCalendario, b: EntradaDeCalendario) => b.hora - a.hora || b.creadaEn.localeCompare(a.creadaEn) || b.id - a.id;

/** Primera foto de una entrada: las adjuntas primero y, si no hay, la primera imagen del documento. */
export const portadaDe = (e: Pick<EntradaDeCalendario, "fotos" | "contenido">): string | null => e.fotos[0] ?? (e.contenido ? (imagenesDe(e.contenido)[0] ?? null) : null);

/** Un resumen por día con entradas. `etiquetaId` = la etiqueta que se muestra encima de cada día (opcional). */
export function resumenDeDias(entradas: EntradaDeCalendario[], etiquetaId: number | null = null): Record<string, DiaCalendario> {
  const porDia = new Map<string, EntradaDeCalendario[]>();
  for (const e of entradas) (porDia.get(e.fecha) ?? porDia.set(e.fecha, []).get(e.fecha)!).push(e);
  const dias: Record<string, DiaCalendario> = {};
  for (const [fecha, lista] of porDia) {
    const nuevasPrimero = [...lista].sort(masNueva);
    const antiguasPrimero = [...nuevasPrimero].reverse();
    const primera = antiguasPrimero[0];
    const conPortada = nuevasPrimero.find((e) => portadaDe(e));
    const conEtiqueta = etiquetaId === null ? undefined : antiguasPrimero.find((e) => e.etiquetas.some((t) => t.id === etiquetaId));
    dias[fecha] = {
      cantidad: lista.length,
      animo: nuevasPrimero.find((e) => e.animo !== null)?.animo ?? null,
      portada: conPortada ? portadaDe(conPortada) : null,
      categoriaId: primera.categoriaId,
      titulo: (primera.titulo ?? "").trim(),
      etiqueta: conEtiqueta ? { valor: conEtiqueta.etiquetas.find((t) => t.id === etiquetaId)?.valor ?? null } : null,
    };
  }
  return dias;
}

/** storypad `selectedTagId`: solo las entradas con esa etiqueta (`null` = todas). */
export const filtrarPorEtiqueta = <T extends { etiquetas: { id: number }[] }>(entradas: T[], etiquetaId: number | null): T[] =>
  etiquetaId === null ? entradas : entradas.filter((e) => e.etiquetas.some((t) => t.id === etiquetaId));

/** Daily You `_countLabel`: el contador del día no pasa de «99+». */
export const textoContador = (n: number): string => (n > 99 ? "99+" : String(n));

// ── Opciones del calendario ──────────────────────────────────────────────────

/** Daily You `Settings.hideImagesInCalendar`, `calendarShowMood` y `calendarTagOverlay` (sin el `hide`: acá es «mostrar»). */
export interface OpcionesCalendario {
  imagenes: boolean;
  animo: boolean;
  /** Id de la etiqueta que se muestra encima de cada día, o null. */
  etiqueta: number | null;
}

export const OPCIONES_CALENDARIO: OpcionesCalendario = { imagenes: true, animo: true, etiqueta: null };

export function esOpcionesCalendario(v: unknown): v is OpcionesCalendario {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.imagenes === "boolean" && typeof o.animo === "boolean" && (o.etiqueta === null || (typeof o.etiqueta === "number" && Number.isInteger(o.etiqueta)));
}

/** Daily You `EntryDayCell`: qué se dibuja en una celda con entradas según las opciones. */
export type ContenidoCelda = { fondo: "portada" | "color"; centro: "numero" | "animo" | "etiqueta"; esquinaAnimo: boolean; esquinaEtiqueta: boolean };

export function contenidoDeCelda(dia: DiaCalendario, o: OpcionesCalendario, etiquetaEsContador = false): ContenidoCelda {
  const conPortada = o.imagenes && dia.portada !== null;
  const conEtiqueta = o.etiqueta !== null && dia.etiqueta !== null;
  const sinImagenes = !o.imagenes;
  // La etiqueta pasa al centro solo si no hay imágenes ni ánimo; un contador queda además en la esquina (Daily You `tagGoesCorner`)
  const etiquetaAlCentro = conEtiqueta && sinImagenes && !o.animo;
  const animoAlCentro = sinImagenes && o.animo && dia.animo !== null && !etiquetaAlCentro;
  return {
    fondo: conPortada ? "portada" : "color",
    centro: etiquetaAlCentro ? "etiqueta" : animoAlCentro ? "animo" : "numero",
    esquinaAnimo: o.imagenes && o.animo && dia.animo !== null && dia.cantidad === 1,
    esquinaEtiqueta: conEtiqueta && (!etiquetaAlCentro || etiquetaEsContador),
  };
}

// ── Selector de mes (Daily You `YearMonthRange`) ─────────────────────────────

export interface AnioMes {
  anio: number;
  mes: number;
}
export interface RangoMeses {
  primero: AnioMes;
  ultimo: AnioMes;
}

const aAnioMes = (clave: string): AnioMes => ({ anio: Number(clave.slice(0, 4)), mes: Number(clave.slice(5, 7)) });
const numeroDeMes = (m: AnioMes) => m.anio * 12 + m.mes;
export const claveDeMes = (m: AnioMes): string => `${String(m.anio).padStart(4, "0")}-${String(m.mes).padStart(2, "0")}`;

/** Del mes de la entrada más antigua al mes de hoy. Sin entradas, solo el mes de hoy. */
export function rangoDeMeses(primeraFecha: string | null, hoy: string): RangoMeses {
  const ultimo = aAnioMes(hoy);
  const primero = primeraFecha && primeraFecha < hoy ? aAnioMes(primeraFecha) : ultimo;
  return { primero, ultimo };
}

export const mesHabilitado = (r: RangoMeses, anio: number, mes: number): boolean => numeroDeMes({ anio, mes }) >= numeroDeMes(r.primero) && numeroDeMes({ anio, mes }) <= numeroDeMes(r.ultimo);

export function acotarMes(r: RangoMeses, anio: number, mes: number): number {
  const minimo = anio === r.primero.anio ? r.primero.mes : 1;
  const maximo = anio === r.ultimo.anio ? r.ultimo.mes : 12;
  return Math.min(Math.max(mes, minimo), maximo);
}

export function acotarAnioMes(r: RangoMeses, clave: string): AnioMes {
  const { anio, mes } = aAnioMes(clave);
  const a = Math.min(Math.max(anio, r.primero.anio), r.ultimo.anio);
  return { anio: a, mes: acotarMes(r, a, mes) };
}

/** Años del selector, del más nuevo al más viejo. */
export const aniosDelRango = (r: RangoMeses): number[] => Array.from({ length: r.ultimo.anio - r.primero.anio + 1 }, (_, i) => r.ultimo.anio - i);

// ── Días con escritura (moodiary `DayWriting` / `byDay`) ─────────────────────

export interface DiaEscrito {
  cantidad: number;
  palabras: number;
  /** Nivel de intensidad 1–4 para el mapa de calor (0 = ninguna entrada). */
  nivel: number;
  /** Promedio de los ánimos del día, o null. */
  animo: number | null;
}

/** moodiary `heatmapLevelResolver`: con menos de 8 días con texto o sin diferencias de palabras, por cantidad; si no, cuartiles de palabras. */
export function resolverNivelCalor(palabrasPorDia: number[]): (cantidad: number, palabras: number) => number {
  const porCantidad = (cantidad: number) => (cantidad <= 1 ? 2 : cantidad === 2 ? 3 : 4);
  const orden = [...palabrasPorDia].sort((a, b) => a - b);
  if (orden.length < 8) return porCantidad;
  const en = (q: number) => orden[Math.round((orden.length - 1) * q)];
  const p25 = en(0.25);
  const p50 = en(0.5);
  const p75 = en(0.75);
  if (p75 <= p25) return porCantidad;
  return (_, palabras) => (palabras < p25 ? 1 : palabras < p50 ? 2 : palabras < p75 ? 3 : 4);
}

/** moodiary `_aggregateByDay`: un registro por día con entradas. */
export function diasEscritos(filas: FilaEstadistica[]): Map<string, DiaEscrito> {
  const grupos = new Map<string, FilaEstadistica[]>();
  for (const f of filas) (grupos.get(f.fecha) ?? grupos.set(f.fecha, []).get(f.fecha)!).push(f);
  const nivelDe = resolverNivelCalor([...grupos.values()].map((g) => g.reduce((s, f) => s + f.palabras, 0)));
  const dias = new Map<string, DiaEscrito>();
  for (const [fecha, g] of grupos) {
    const palabras = g.reduce((s, f) => s + f.palabras, 0);
    const animos = g.flatMap((f) => (f.animo === null ? [] : [f.animo]));
    dias.set(fecha, { cantidad: g.length, palabras, nivel: nivelDe(g.length, palabras), animo: animos.length ? animos.reduce((s, a) => s + a, 0) / animos.length : null });
  }
  return dias;
}

/** moodiary `_periodCount`: entradas entre dos fechas (ambas incluidas), sumando día por día. */
export function cantidadEnRango(dias: ReadonlyMap<string, DiaEscrito>, desde: string, hasta: string): number {
  let suma = 0;
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) suma += dias.get(f)?.cantidad ?? 0;
  return suma;
}

export const cantidadDelMes = (dias: ReadonlyMap<string, DiaEscrito>, mes: string): number => cantidadEnRango(dias, `${mes}-01`, `${mes}-${String(diasDelMes(mes)).padStart(2, "0")}`);
export const cantidadDelAnio = (dias: ReadonlyMap<string, DiaEscrito>, anio: number): number => cantidadEnRango(dias, `${anio}-01-01`, `${anio}-12-31`);

/** moodiary `lastYearCount`: entradas de los últimos 365 días (hoy incluido). */
export const cantidadUltimoAnio = (dias: ReadonlyMap<string, DiaEscrito>, hoy: string): number => cantidadEnRango(dias, sumarDias(hoy, -364), hoy);

/** Entradas de cada mes del año, de enero a diciembre. */
export function cantidadPorMes(dias: ReadonlyMap<string, DiaEscrito>, anio: number): number[] {
  const meses = Array<number>(12).fill(0);
  for (const [fecha, d] of dias) if (fecha.startsWith(`${anio}-`)) meses[Number(fecha.slice(5, 7)) - 1] += d.cantidad;
  return meses;
}

/** storypad `getStoryCountsByYear`: los años con entradas y cuántas hay en cada uno, del más nuevo al más viejo. Sin entradas, solo el año de hoy con 0. */
export function aniosConEntradas(dias: ReadonlyMap<string, DiaEscrito>, hoy: string): { anio: number; cantidad: number }[] {
  const porAnio = new Map<number, number>();
  for (const [fecha, d] of dias) porAnio.set(Number(fecha.slice(0, 4)), (porAnio.get(Number(fecha.slice(0, 4))) ?? 0) + d.cantidad);
  if (!porAnio.size) return [{ anio: Number(hoy.slice(0, 4)), cantidad: 0 }];
  return [...porAnio].map(([anio, cantidad]) => ({ anio, cantidad })).sort((a, b) => b.anio - a.anio);
}

export const primeraFecha = (filas: { fecha: string }[]): string | null => filas.reduce<string | null>((min, f) => (min === null || f.fecha < min ? f.fecha : min), null);

// ── Mapa de calor (moodiary `MHeatmap`) ──────────────────────────────────────

/** Lunes de la semana de `fecha`. */
export const lunesDe = (fecha: string): string => sumarDias(fecha, -diaSemana(fecha));

/** Posiciones del color de cada nivel entre el fondo (0) y el color primario (1): moodiary `_kLevelStops`. */
export const PASOS_NIVEL = [0, 0.3, 0.53, 0.77, 1] as const;

export interface ColumnaCalor {
  /** Lunes de la semana. */
  inicio: string;
  /** Siete días de lunes a domingo; `null` = fuera del rango mostrado. */
  dias: (string | null)[];
}

/**
 * Las columnas del mapa: `semanas` semanas que terminan en la semana de `fin`. Los días después de `fin` o antes de `inicio` quedan en blanco.
 * Sin `inicio`, son las últimas 53 semanas como en moodiary.
 */
export function columnasCalor(fin: string, semanas = 53, inicio: string | null = null): ColumnaCalor[] {
  const primera = lunesDe(sumarDias(fin, -(semanas - 1) * 7));
  return Array.from({ length: semanas }, (_, w) => {
    const lunes = sumarDias(primera, w * 7);
    return { inicio: lunes, dias: Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)).map((f) => (f > fin || (inicio !== null && f < inicio) ? null : f)) };
  });
}

/** Cuántas semanas hacen falta para mostrar de `inicio` a `fin`. */
export const semanasEntre = (inicio: string, fin: string): number => Math.floor(diasEntre(lunesDe(inicio), fin) / 7) + 1;

/** moodiary `_MonthLabels`: sobre qué columna va el nombre de cada mes. La última columna o dos no llevan nombre (no cabría). */
export function marcasDeMeses(columnas: ColumnaCalor[], inicio: string | null = null): { columna: number; mes: string }[] {
  const marcas: { columna: number; mes: string }[] = [];
  let ultimoMes = "";
  columnas.forEach((c, w) => {
    const desde = inicio !== null && c.inicio < inicio ? inicio : c.inicio;
    const mes = desde.slice(0, 7);
    if (mes === ultimoMes) return;
    ultimoMes = mes;
    if (w > columnas.length - 3 && !(w === 0 && inicio !== null)) return;
    marcas.push({ columna: w, mes });
  });
  return marcas;
}
