// Diario (lane 289): recuerdos — «En este día», hace 6 meses, 1 mes y 1 semana, y un buen día y un día al azar que se repiten todo el día. Sin base ni red, con tests.
// Portado de vendor/Daily_You/lib/{flashback_manager,time_manager}.dart, lib/models/flashback.dart y lib/pages/settings/flashback_settings.dart (Demizo/Daily_You@7cc237d)
// y de vendor/storypad/lib/views/{throwback,home/home_view_model}.dart (theachoem/storypad@a76825e: las entradas del mismo día de otros años y «responder a tu yo pasado»).
// Las fechas son claves "YYYY-MM-DD" (la zona de la familia ya viene aplicada).
import { sumarDias } from "./busqueda.ts";

export type ClaveRecuerdo = "anios" | "seis" | "uno" | "semana" | "bueno" | "azar";
export const CLAVES_RECUERDO: ClaveRecuerdo[] = ["anios", "seis", "uno", "semana", "bueno", "azar"];

/** Daily You `Settings.showFlashbacks`, `show*`, `excludeBadDaysFromFlashbacks` y `hideImagesInFlashbacks` (todo prendido salvo excluir días malos). */
export interface OpcionesRecuerdos {
  mostrar: boolean;
  sinMalos: boolean;
  ocultarImagenes: boolean;
  activos: Record<ClaveRecuerdo, boolean>;
}

export const OPCIONES_RECUERDOS: OpcionesRecuerdos = {
  mostrar: true,
  sinMalos: false,
  ocultarImagenes: false,
  activos: { anios: true, seis: true, uno: true, semana: true, bueno: true, azar: true },
};

export function esOpcionesRecuerdos(v: unknown): v is OpcionesRecuerdos {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  const a = o.activos as Record<string, unknown> | null;
  return typeof o.mostrar === "boolean" && typeof o.sinMalos === "boolean" && typeof o.ocultarImagenes === "boolean" && typeof a === "object" && a !== null && CLAVES_RECUERDO.every((c) => typeof a[c] === "boolean");
}

/** Lo mínimo de una entrada para elegir recuerdos. */
export interface FilaRecuerdo {
  id: number;
  fecha: string;
  /** Minutos desde la medianoche. */
  hora: number;
  animo: number | null;
}

export interface EntradaRecordada {
  id: number;
  /** Texto que acompaña a la entrada en el grupo: «Hace 2 años», la hora, o el título del grupo si es una sola. */
  etiqueta: string;
}

export interface GrupoRecuerdo {
  clave: ClaveRecuerdo;
  titulo: string;
  /** Daily You `Flashback.isOnThisDay`. */
  enEsteDia: boolean;
  entradas: EntradaRecordada[];
}

export interface EleccionesDelDia {
  fecha: string;
  bueno: number | null;
  azar: number | null;
}

// ── Textos (Daily You `intl_es.arb`) ─────────────────────────────────────────

const plural = (n: number, uno: string, otros: string) => `Hace ${n} ${n === 1 ? uno : otros}`;
export const haceSemanas = (n: number) => plural(n, "semana", "semanas");
export const haceMeses = (n: number) => plural(n, "mes", "meses");
export const haceAnios = (n: number) => plural(n, "año", "años");

export const TITULOS_RECUERDO: Record<ClaveRecuerdo, string> = {
  anios: "En este día",
  seis: haceMeses(6),
  uno: haceMeses(1),
  semana: haceSemanas(1),
  bueno: "Un buen día",
  azar: "Un día aleatorio",
};

// ── Fechas (Daily You `TimeManager`) ─────────────────────────────────────────

const partes = (f: string) => f.split("-").map(Number) as [number, number, number];

/** `isSameCalendarDayOfYear`: mismo día y mes (en cualquier año). */
export const mismoDiaDelAnio = (a: string, b: string): boolean => a.slice(5) === b.slice(5);

/**
 * `datesExactMonthDiff`: cuántos meses hay entre las dos fechas si caen en el mismo número de día de meses distintos; si no, -1.
 * (Un 31 no tiene recuerdo «hace un mes» cuando el mes anterior termina el 30.)
 */
export function mesesExactos(a: string, b: string): number {
  const [ya, ma, da] = partes(a);
  const [yb, mb, db] = partes(b);
  if (da !== db) return -1;
  if (ya === yb && ma === mb) return -1;
  return Math.abs((yb - ya) * 12 + mb - ma);
}

export const diaMalo = (animo: number | null): boolean => animo === 1 || animo === 2;
export const diaEstupendo = (animo: number | null): boolean => animo === 4 || animo === 5;

// ── Elección del día (Daily You `_resolveDailyPick`) ─────────────────────────

/** `int.tryParse("${now.year}${now.month}${now.day}")`: sin ceros a la izquierda en el mes ni en el día. */
export function semillaDelDia(hoy: string): number {
  const [y, m, d] = partes(hoy);
  return Number(`${y}${m}${d}`);
}

/** Generador con semilla (mulberry32). No repite la secuencia de `Random(seed)` de Dart: solo importa que sea la misma todo el día. */
export function generador(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Devuelve el id ya elegido hoy si sigue siendo válido; si no, uno nuevo al azar entre los no usados. */
export function elegirDelDia(fijo: number | null, pozo: FilaRecuerdo[], usadas: ReadonlySet<number>, semilla: number): number | null {
  if (fijo !== null && pozo.some((f) => f.id === fijo && !usadas.has(f.id))) return fijo;
  if (!pozo.length) return null;
  const azar = generador(semilla);
  for (let intento = 0; intento < pozo.length; intento++) {
    const candidata = pozo[Math.floor(azar() * pozo.length)];
    if (!usadas.has(candidata.id)) return candidata.id;
  }
  return null;
}

/** Con 7 entradas o menos no hay recuerdos al azar (Daily You). */
export const MIN_PARA_AZAR = 7;

const masNueva = (a: FilaRecuerdo, b: FilaRecuerdo) => (a.fecha === b.fecha ? b.hora - a.hora || b.id - a.id : a.fecha < b.fecha ? 1 : -1);
const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export interface ResultadoRecuerdos {
  grupos: GrupoRecuerdo[];
  elegidos: EleccionesDelDia;
}

/**
 * Daily You `FlashbackManager.getFlashbacks`. Se recorren las entradas de la más vieja a la más nueva y cada una entra en el primer grupo que cumple:
 * mismo día de un año anterior → hace 6 meses → hace 1 mes → hace 1 semana; si no cumple ninguno y fue un día estupendo, queda para «Un buen día».
 * `fijos` = lo elegido antes hoy (para que no cambie al guardar otra entrada).
 */
export function calcularRecuerdos(filas: FilaRecuerdo[], hoy: string, opciones: Pick<OpcionesRecuerdos, "activos" | "sinMalos">, fijos: EleccionesDelDia | null = null): ResultadoRecuerdos {
  const { activos } = opciones;
  const todas = (opciones.sinMalos ? filas.filter((f) => !diaMalo(f.animo)) : [...filas]).sort(masNueva);
  const elegidos: EleccionesDelDia = { fecha: hoy, bueno: null, azar: null };
  if (todas.length === 0) return { grupos: [], elegidos };

  const usadas = new Set<number>();
  const enEsteDia: EntradaRecordada[] = [];
  const hace: Record<"seis" | "uno" | "semana", FilaRecuerdo[]> = { seis: [], uno: [], semana: [] };
  const contentos: FilaRecuerdo[] = [];
  const hoyAnio = Number(hoy.slice(0, 4));
  const hacerUnaSemana = sumarDias(hoy, -7);

  for (const f of [...todas].reverse()) {
    if (usadas.has(f.id)) continue;
    if (activos.anios && mismoDiaDelAnio(f.fecha, hoy) && Number(f.fecha.slice(0, 4)) !== hoyAnio) {
      enEsteDia.push({ id: f.id, etiqueta: haceAnios(hoyAnio - Number(f.fecha.slice(0, 4))) });
      usadas.add(f.id);
    } else if (activos.seis && mesesExactos(f.fecha, hoy) === 6) {
      hace.seis.push(f);
      usadas.add(f.id);
    } else if (activos.uno && mesesExactos(f.fecha, hoy) === 1) {
      hace.uno.push(f);
      usadas.add(f.id);
    } else if (activos.semana && f.fecha === hacerUnaSemana) {
      hace.semana.push(f);
      usadas.add(f.id);
    } else if (diaEstupendo(f.animo)) {
      contentos.push(f);
    }
  }

  const grupos: GrupoRecuerdo[] = [];
  if (enEsteDia.length) grupos.push({ clave: "anios", titulo: TITULOS_RECUERDO.anios, enEsteDia: true, entradas: enEsteDia.reverse() });
  const sueltas = (clave: "seis" | "uno" | "semana" | "bueno" | "azar", lista: FilaRecuerdo[]) => {
    if (!lista.length) return;
    const titulo = TITULOS_RECUERDO[clave];
    grupos.push({ clave, titulo, enEsteDia: false, entradas: lista.map((f) => ({ id: f.id, etiqueta: lista.length === 1 ? titulo : hora(f.hora) })) });
  };
  sueltas("seis", hace.seis);
  sueltas("uno", hace.uno);
  sueltas("semana", hace.semana);

  if (todas.length > MIN_PARA_AZAR) {
    const semilla = semillaDelDia(hoy);
    const delDia = fijos && fijos.fecha === hoy ? fijos : null;
    if (activos.bueno) {
      const id = elegirDelDia(delDia?.bueno ?? null, contentos, usadas, semilla);
      if (id !== null) {
        elegidos.bueno = id;
        usadas.add(id);
        sueltas("bueno", [todas.find((f) => f.id === id)!]);
      }
    }
    if (activos.azar) {
      const id = elegirDelDia(delDia?.azar ?? null, todas, usadas, semilla);
      if (id !== null) {
        elegidos.azar = id;
        usadas.add(id);
        sueltas("azar", [todas.find((f) => f.id === id)!]);
      }
    }
  }
  return { grupos, elegidos };
}

// ── «En este día» (storypad `throwback`, Daily You `isOnThisDayMatch`) ───────

const RE_DIA_MES = /^(\d{2})-(\d{2})$/;

/** "MM-DD" válido (el 29 de febrero vale). */
export function esDiaMes(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const m = RE_DIA_MES.exec(v);
  if (!m) return false;
  const mes = Number(m[1]);
  const dia = Number(m[2]);
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= new Date(Date.UTC(2000, mes, 0)).getUTCDate();
}

/** Las fechas de ese día y mes entre dos años (ambos incluidos). Los años en que no existe (29 de febrero) se saltean. */
export function fechasDelDiaMes(diaMes: string, desdeAnio: number, hastaAnio: number): string[] {
  const out: string[] = [];
  for (let anio = hastaAnio; anio >= desdeAnio; anio--) {
    const f = `${String(anio).padStart(4, "0")}-${diaMes}`;
    const d = new Date(`${f}T00:00:00Z`);
    if (!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f) out.push(f);
  }
  return out;
}

/**
 * storypad `list_tile.throwback.*`: el título de la retrospectiva. De otro día que no es hoy: «de esta fecha»; de hoy: «de hace 1 año» si hay una entrada del año pasado,
 * y si no «de hace unos años». (El `SpThrowbackTile` original compara el año del primer recuerdo con el actual y siempre cae en «de esta fecha»; acá se aplica lo que quiso decir.)
 */
export function tituloDeRetrospectiva(anios: number[], hoyAnio: number, esHoy: boolean): string {
  if (!esHoy) return "Un recuerdo de esta fecha.";
  return anios.includes(hoyAnio - 1) ? "Un recuerdo de hace 1 año." : "Un recuerdo de hace unos años.";
}

/** Fecha en la que se escribe la respuesta: ese día y mes del año de hoy; `null` si todavía no llegó. */
export function fechaDeRespuesta(diaMes: string, hoy: string): string | null {
  if (!esDiaMes(diaMes)) return null;
  const f = fechasDelDiaMes(diaMes, Number(hoy.slice(0, 4)), Number(hoy.slice(0, 4)))[0];
  return f && f <= hoy ? f : null;
}
