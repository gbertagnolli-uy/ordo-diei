// Diario (lane 289): línea de tiempo de las entradas — agrupadas por mes, con el comienzo de cada día y un corte cuando se salta un día entero. Sin base ni red, con tests.
// Portado de vendor/moodiary/packages/feature/moodiary_diary/lib/src/application/{timeline_group,timeline_controller,diary_stamp}.dart y
// presentation/widget/{timeline_view,timeline_tile}.dart (ZhuJHua/moodiary@2c552dd) y de vendor/Daily_You/lib/pages/entry_timeline_page.dart (Demizo/Daily_You@7cc237d:
// orden ascendente o descendente). Las fechas son claves "YYYY-MM-DD" (la zona de la familia ya viene aplicada).
import { diasEntre } from "./estadisticas.ts";

/** moodiary `DiarySort` (`timeDesc`, `lastModifiedDesc`) más el ascendente de Daily You (`timelineSortOrder`). */
export type OrdenLinea = "fecha-desc" | "fecha-asc" | "edicion";
export const ORDENES_LINEA: { valor: OrdenLinea; titulo: string }[] = [
  { valor: "fecha-desc", titulo: "Más nuevas" },
  { valor: "fecha-asc", titulo: "Más viejas" },
  { valor: "edicion", titulo: "Última edición" },
];
export const esOrdenLinea = (v: unknown): v is OrdenLinea => v === "fecha-desc" || v === "fecha-asc" || v === "edicion";

/** Entradas por página. Siempre se completa el último día, así que puede traer algunas más. */
export const PAGINA_LINEA = 40;

/** Cuándo cuenta la entrada en la línea: su fecha y hora, o (en «Última edición») cuándo se editó por última vez, en la zona de la familia. */
export interface Sello {
  fecha: string;
  /** Minutos desde la medianoche. */
  hora: number;
}

export interface ItemLinea<T> {
  entrada: T;
  sello: Sello;
}

export interface NodoLinea<T> {
  item: ItemLinea<T>;
  /** Primera entrada de su día: lleva el número y el día de la semana. */
  inicioDeDia: boolean;
  /** Hay más de un día de distancia con la entrada anterior: el eje se corta con una línea punteada. */
  corteAntes: boolean;
}

export interface MesLinea<T> {
  /** "YYYY-MM". */
  mes: string;
  nodos: NodoLinea<T>[];
}

/** moodiary `buildTimeline`: respeta el orden recibido. El corte entre meses no reinicia la detección de saltos. */
export function construirLinea<T>(items: ItemLinea<T>[]): MesLinea<T>[] {
  const meses: MesLinea<T>[] = [];
  let anterior: string | null = null;
  for (const item of items) {
    const mes = item.sello.fecha.slice(0, 7);
    if (!meses.length || meses[meses.length - 1].mes !== mes) meses.push({ mes, nodos: [] });
    meses[meses.length - 1].nodos.push({
      item,
      inicioDeDia: anterior === null || item.sello.fecha !== anterior,
      corteAntes: anterior !== null && Math.abs(diasEntre(anterior, item.sello.fecha)) > 1,
    });
    anterior = item.sello.fecha;
  }
  return meses;
}

/** Todos los nodos en una sola lista (para mirar el de arriba y el de abajo). */
export const aplanarLinea = <T>(meses: MesLinea<T>[]): NodoLinea<T>[] => meses.flatMap((m) => m.nodos);

// ── Cursor de la página siguiente ────────────────────────────────────────────

export type CursorLinea = { tipo: "fecha"; fecha: string } | { tipo: "edicion"; editadaEn: string; id: number };

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RE_EDICION = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_(\d+)$/;

/** El cursor que viene en la URL, o `null` si es la primera página. Lanza si no es válido para ese orden. */
export function leerCursor(orden: OrdenLinea, crudo: string | null): CursorLinea | null {
  if (!crudo) return null;
  if (orden === "edicion") {
    const m = RE_EDICION.exec(crudo);
    if (!m || Number.isNaN(Date.parse(m[1]))) throw new Error("Cursor inválido");
    return { tipo: "edicion", editadaEn: m[1], id: Number(m[2]) };
  }
  if (!RE_FECHA.test(crudo) || Number.isNaN(Date.parse(`${crudo}T00:00:00Z`))) throw new Error("Cursor inválido");
  return { tipo: "fecha", fecha: crudo };
}

export const escribirCursor = (c: CursorLinea): string => (c.tipo === "fecha" ? c.fecha : `${c.editadaEn}_${c.id}`);

/** Orden dentro de un día: por hora y, a igual hora, por creación e id. `desc` = la más nueva primero. */
export function compararEnElDia(a: { hora: number; creadaEn: string; id: number }, b: { hora: number; creadaEn: string; id: number }, desc: boolean): number {
  const d = a.hora - b.hora || a.creadaEn.localeCompare(b.creadaEn) || a.id - b.id;
  return desc ? -d : d;
}

/** «Sin categoría» en el filtro de la línea. */
export const SIN_CATEGORIA = "ninguna";

/** El filtro de categoría de la URL: un id, `ninguna` o nada. */
export function leerCategoria(crudo: string | null): number | typeof SIN_CATEGORIA | null {
  if (!crudo) return null;
  if (crudo === SIN_CATEGORIA) return SIN_CATEGORIA;
  const n = Number(crudo);
  if (!Number.isInteger(n) || n <= 0) throw new Error("Categoría inválida");
  return n;
}
