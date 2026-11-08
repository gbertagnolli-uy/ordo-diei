// Diario (lane 287): reglas puras de las estadísticas. Sin base ni red, con tests.
// Portado de vendor/Daily_You/lib/{stats/{entry_stats,stats_range,streaks}.dart,models/stats_subject.dart,utils/{bucket_combiner,chart_y_range,chart_axis}.dart,
// widgets/{distribution_chart,value_over_time_chart,label_summary_card}.dart} (Demizo/Daily_You@7cc237d),
// de vendor/storypad/lib/core/{objects/stats/{stats_range,story_stats_object}.dart,services/stories/story_stats_service.dart} (theachoem/storypad@a76825e)
// y de vendor/moodiary/packages/feature_base/moodiary_data/lib/src/mood_insights.dart (ZhuJHua/moodiary@2c552dd).
// Las fechas son claves "YYYY-MM-DD" (la zona de la familia ya viene aplicada); todo el cálculo con días corridos en UTC, sin horario de verano.
import { sumarDias } from "./busqueda.ts";

/** Lo mínimo de una entrada para contarla. El servidor la arma (ver `servidor-estadisticas.ts`). */
export interface FilaEstadistica {
  id: number;
  fecha: string;
  /** Minutos desde la medianoche, o null. Solo desempata el orden dentro del día. */
  hora: number | null;
  animo: number | null;
  palabras: number;
  fotos: number;
  categoriaId: number | null;
  etiquetas: { id: number; valor: string | null }[];
}

export const MAX_FILAS = 20_000;

// ── Fechas ───────────────────────────────────────────────────────────────────

const aMs = (f: string) => {
  const [y, m, d] = f.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Días corridos de `a` a `b` (positivo si `b` es posterior). */
export const diasEntre = (a: string, b: string): number => Math.round((aMs(b) - aMs(a)) / 86_400_000);

/** 0 = lunes … 6 = domingo (la semana de la app empieza el lunes, decisión E2). */
export const diaSemana = (f: string): number => (new Date(aMs(f)).getUTCDay() + 6) % 7;

const ultimoDiaDelMes = (anio: number, mes: number) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();

/** Suma meses acotando al último día del mes de destino (decisión E3): 31 de marzo menos un mes = 28/29 de febrero. */
export function sumarMeses(f: string, n: number): string {
  const [y, m, d] = f.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const anio = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  return `${String(anio).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(Math.min(d, ultimoDiaDelMes(anio, mes))).padStart(2, "0")}`;
}

const primeroDelMes = (f: string) => `${f.slice(0, 7)}-01`;
const primeroDelAnio = (f: string) => `${f.slice(0, 4)}-01-01`;

/** Daily You `wordsCount`: palabras separadas por espacios. */
export const contarPalabras = (texto: string): number => (texto.trim() ? texto.trim().split(/\s+/).length : 0);

const masReciente = (a: FilaEstadistica, b: FilaEstadistica) => (a.fecha === b.fecha ? (b.hora ?? 0) - (a.hora ?? 0) || b.id - a.id : a.fecha < b.fecha ? 1 : -1);

// ── Ánimo ────────────────────────────────────────────────────────────────────

export const NIVELES = [1, 2, 3, 4, 5] as const;
const esDiaMalo = (a: number | null) => a === 1 || a === 2;
const esDiaEstupendo = (a: number | null) => a === 4 || a === 5;

/** moodiary `moodLevel`: el nivel más cercano al promedio (acotado a 1–5). */
export const nivelDePromedio = (promedio: number | null): number | null => (promedio === null ? null : Math.min(5, Math.max(1, Math.round(promedio))));

function promedio(valores: Iterable<number>): number | null {
  let suma = 0;
  let n = 0;
  for (const v of valores) {
    suma += v;
    n++;
  }
  return n === 0 ? null : suma / n;
}

/** Daily You `moodTotals`: cuántas entradas tiene cada nivel. */
export function totalesAnimo(filas: FilaEstadistica[]): Record<number, number> {
  const t: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const f of filas) if (f.animo !== null && f.animo in t) t[f.animo]++;
  return t;
}

/** Daily You `greatDayCount`: días distintos con alguna entrada «bien» o «muy bien». */
export const diasEstupendos = (filas: FilaEstadistica[]): number => new Set(filas.filter((f) => esDiaEstupendo(f.animo)).map((f) => f.fecha)).size;

export const totalPalabras = (filas: FilaEstadistica[]): number => filas.reduce((s, f) => s + f.palabras, 0);
export const diasConEntradas = (filas: FilaEstadistica[]): number => new Set(filas.map((f) => f.fecha)).size;

// ── Rachas y rangos (Daily You) ──────────────────────────────────────────────

export interface Rachas {
  actual: number;
  mayor: number;
  /** Días desde el último día malo (null = nunca hubo uno). */
  diasDesdeDiaMalo: number | null;
}

/** Daily You `calculateStreaks`. La racha actual sigue viva si la última entrada es de hoy o de ayer. */
export function calcularRachas(filas: FilaEstadistica[], hoy: string): Rachas {
  if (filas.length === 0) return { actual: 0, mayor: 0, diasDesdeDiaMalo: null };
  const orden = [...filas].sort(masReciente);
  const vigente = diasEntre(orden[0].fecha, hoy) <= 1;
  let actual = 0;
  let mayor = 0;
  let diasDesdeDiaMalo: number | null = null;
  let activa = 0;
  let primera = true;
  let previo: string | null = null;
  for (const f of orden) {
    if (diasDesdeDiaMalo === null && esDiaMalo(f.animo)) diasDesdeDiaMalo = diasEntre(f.fecha, hoy);
    if (previo === null) {
      activa = 1;
      mayor = 1;
    } else if (previo !== f.fecha) {
      const salto = diasEntre(f.fecha, previo);
      if (salto === 1) {
        activa += 1;
        if (activa > mayor) mayor = activa;
      } else if (salto > 1) {
        if (primera) {
          if (vigente) actual = activa;
          primera = false;
        }
        activa = 1;
      }
    }
    previo = f.fecha;
  }
  if (primera && vigente) actual = activa;
  return { actual, mayor, diasDesdeDiaMalo };
}

export type RangoMovil = "mes" | "seis" | "anio" | "todo";
export const RANGOS_MOVILES: { valor: RangoMovil; titulo: string }[] = [
  { valor: "mes", titulo: "1 mes" },
  { valor: "seis", titulo: "6 meses" },
  { valor: "anio", titulo: "1 año" },
  { valor: "todo", titulo: "Todo el tiempo" },
];
const MESES_DE: Record<RangoMovil, number> = { mes: 1, seis: 6, anio: 12, todo: 0 };

/** Daily You `entriesInRange`: las entradas de los últimos 1, 6 o 12 meses, o todas (decisión E4: incluye el día de inicio). */
export function filasEnRango(filas: FilaEstadistica[], rango: RangoMovil, hoy: string): FilaEstadistica[] {
  const meses = MESES_DE[rango];
  if (meses === 0) return [...filas];
  const inicio = sumarMeses(hoy, -meses);
  return filas.filter((f) => f.fecha >= inicio);
}

export const esRangoMovil = (v: unknown): v is RangoMovil => v === "mes" || v === "seis" || v === "anio" || v === "todo";

// ── Por día de la semana (Daily You) ─────────────────────────────────────────

export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

/** Daily You `averageByDayOfWeek`: promedio de `valor` por día de la semana (lunes primero). Sin datos → `vacio`. */
export function promedioPorDiaSemana(filas: FilaEstadistica[], valor: (f: FilaEstadistica) => number | null, vacio: number | null = null): (number | null)[] {
  const porDia: number[][] = [[], [], [], [], [], [], []];
  for (const f of filas) {
    const v = valor(f);
    if (v !== null) porDia[diaSemana(f.fecha)].push(v);
  }
  return porDia.map((v) => promedio(v) ?? vacio);
}

/** Daily You `countByDayOfWeek`. */
export function conteoPorDiaSemana(filas: FilaEstadistica[], cumple: (f: FilaEstadistica) => boolean): number[] {
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (const f of filas) if (cumple(f)) c[diaSemana(f.fecha)]++;
  return c;
}

// ── Contadores y etiquetas (Daily You) ───────────────────────────────────────

/** Daily You `trackerValuesByEntry`: valor numérico del contador en cada entrada que lo tiene. */
export function valoresContador(filas: FilaEstadistica[], etiquetaId: number): Map<number, number> {
  const m = new Map<number, number>();
  for (const f of filas) {
    const e = f.etiquetas.find((x) => x.id === etiquetaId);
    if (!e || e.valor === null || e.valor.trim() === "") continue;
    const n = Number(e.valor.replace(",", "."));
    if (Number.isFinite(n)) m.set(f.id, n);
  }
  return m;
}

export const idsConEtiqueta = (filas: FilaEstadistica[], etiquetaId: number): Set<number> => new Set(filas.filter((f) => f.etiquetas.some((e) => e.id === etiquetaId)).map((f) => f.id));

/** Daily You `trackerYRange`. */
export function rangoYContador(valores: number[]): { min: number; max: number } {
  if (valores.length === 0) return { min: 0, max: 10 };
  const min = Math.min(...valores);
  return { min: min >= 0 ? 0 : min, max: Math.max(...valores) };
}

/** Daily You `DynamicYRange`: arranca en 0 y llega al máximo de los datos. */
export function rangoDinamico(valores: Iterable<number>): { min: number; max: number } {
  let max = 0;
  for (const v of valores) if (v > max) max = v;
  return { min: 0, max: max <= 0 ? 1 : max };
}

export interface Cobertura {
  presentes: number;
  ausentes: number;
  total: number;
  /** 0–100 con un decimal. */
  porcentaje: number;
}

/** Daily You `LabelSummaryCard`: en cuántas entradas del rango está (o no) la etiqueta. */
export function cobertura(filas: FilaEstadistica[], etiquetaId: number): Cobertura {
  const presentes = filas.filter((f) => f.etiquetas.some((e) => e.id === etiquetaId)).length;
  const total = filas.length;
  return { presentes, ausentes: total - presentes, total, porcentaje: total > 0 ? Math.round((presentes / total) * 1000) / 10 : 0 };
}

// ── Series agrupadas (Daily You `ValueOverTimeChart`) ────────────────────────

export type Agrupacion = "dia" | "semana" | "mes" | "anio";
export const AGRUPACIONES: { valor: Agrupacion; titulo: string }[] = [
  { valor: "dia", titulo: "Día" },
  { valor: "semana", titulo: "Semana" },
  { valor: "mes", titulo: "Mes" },
  { valor: "anio", titulo: "Año" },
];
export const esAgrupacion = (v: unknown): v is Agrupacion => v === "dia" || v === "semana" || v === "mes" || v === "anio";

const UMBRAL_MES = 35;
const UMBRAL_ANIO = 366;

/** Qué agrupaciones tienen sentido según cuántos días abarca la serie. */
export function agrupacionesDisponibles(dias: number): Agrupacion[] {
  if (dias <= UMBRAL_MES) return ["dia", "semana"];
  if (dias <= 2 * UMBRAL_ANIO) return ["semana", "mes"];
  return ["mes", "anio"];
}

export const agrupacionPorDefecto = (dias: number): Agrupacion => (dias <= UMBRAL_ANIO ? "semana" : "mes");

/** La agrupación preferida si sirve; si no, la más cercana hacia las más gruesas y luego hacia las finas. */
export function agrupacionEfectiva(dias: number, preferida: Agrupacion | null): Agrupacion {
  const disponibles = agrupacionesDisponibles(dias);
  if (!preferida) return agrupacionPorDefecto(dias);
  if (disponibles.includes(preferida)) return preferida;
  const orden: Agrupacion[] = ["dia", "semana", "mes", "anio"];
  const i = orden.indexOf(preferida);
  for (let k = i + 1; k < orden.length; k++) if (disponibles.includes(orden[k])) return orden[k];
  for (let k = i - 1; k >= 0; k--) if (disponibles.includes(orden[k])) return orden[k];
  return disponibles[0];
}

/** Inicio de cada cubeta entre `inicio` y `fin` (inclusive). Las de mes y año arrancan el día 1. */
export function cubetas(inicio: string, fin: string, agrupacion: Agrupacion): string[] {
  const salida: string[] = [];
  if (agrupacion === "dia" || agrupacion === "semana") {
    const paso = agrupacion === "dia" ? 1 : 7;
    for (let c = inicio; c <= fin; c = sumarDias(c, paso)) salida.push(c);
  } else if (agrupacion === "mes") {
    for (let c = primeroDelMes(inicio); c <= fin; c = sumarMeses(c, 1)) salida.push(c);
  } else {
    for (let c = primeroDelAnio(inicio); c <= fin; c = sumarMeses(c, 12)) salida.push(c);
  }
  return salida;
}

/** Daily You `bucketIndexAtOrBefore`: índice de la última cubeta que arranca en `fecha` o antes (-1 si ninguna). */
export function indiceCubeta(lista: string[], fecha: string): number {
  let bajo = 0;
  let alto = lista.length - 1;
  let hallado = -1;
  while (bajo <= alto) {
    const medio = (bajo + alto) >> 1;
    if (lista[medio] > fecha) alto = medio - 1;
    else {
      hallado = medio;
      bajo = medio + 1;
    }
  }
  return hallado;
}

export type Combinar = "promedio" | "suma";
const combinar = (modo: Combinar, valores: number[]) => (modo === "suma" ? valores.reduce((a, b) => a + b, 0) : valores.reduce((a, b) => a + b, 0) / valores.length);

export interface PuntoSerie {
  fecha: string;
  valor: number;
}
export interface CubetaSerie {
  /** Inicio de la cubeta. */
  fecha: string;
  /** null = ningún dato en esa cubeta (la línea se corta). */
  valor: number | null;
}

/** Cubetas de la serie, desde la primera fecha con datos hasta hoy. */
export function serieAgrupada(puntos: PuntoSerie[], agrupacion: Agrupacion, hoy: string, modo: Combinar): CubetaSerie[] {
  if (puntos.length === 0) return [];
  const inicio = puntos.reduce((m, p) => (p.fecha < m ? p.fecha : m), puntos[0].fecha);
  const lista = cubetas(inicio, hoy, agrupacion);
  const valores: number[][] = lista.map(() => []);
  for (const p of puntos) {
    const i = indiceCubeta(lista, p.fecha);
    if (i >= 0) valores[i].push(p.valor);
  }
  return lista.map((fecha, i) => ({ fecha, valor: valores[i].length ? combinar(modo, valores[i]) : null }));
}

/** Días que abarca la serie hasta hoy (mínimo 1). */
export function diasDeSerie(puntos: PuntoSerie[], hoy: string): number {
  if (puntos.length === 0) return 1;
  const inicio = puntos.reduce((m, p) => (p.fecha < m ? p.fecha : m), puntos[0].fecha);
  return Math.max(1, diasEntre(inicio, hoy));
}

// ── Distribución en bins (Daily You `DistributionChart`) ─────────────────────

export interface Bin {
  min: number;
  max: number;
  n: number;
  /** Presente cuando el bin es un valor suelto. */
  etiqueta?: string;
}

const MAX_VALORES_DISCRETOS = 10;
const MAX_BINS = 8;
const binsPorMuestra = (n: number) => (n <= 15 ? 5 : n <= 40 ? 6 : n <= 100 ? 7 : 8);

export const esEntero = (v: number) => Number.isInteger(v);

export function formatearNumero(v: number): string {
  if (Math.abs(v) >= 100) return String(Math.trunc(v));
  return v.toFixed(1);
}

export function calcularBins(datos: number[]): Bin[] {
  if (datos.length === 0) return [];
  const todosEnteros = datos.every(esEntero);
  const distintos = [...new Set(datos)].sort((a, b) => a - b);
  if (distintos.length <= MAX_VALORES_DISCRETOS) {
    const cuentas = new Map(distintos.map((v) => [v, 0]));
    for (const v of datos) cuentas.set(v, (cuentas.get(v) ?? 0) + 1);
    return distintos.map((v) => ({ min: v, max: v, n: cuentas.get(v) ?? 0, etiqueta: todosEnteros ? String(v) : formatearNumero(v) }));
  }
  const minimo = distintos[0];
  const maximo = distintos[distintos.length - 1];
  const cantidad = Math.min(binsPorMuestra(datos.length), MAX_BINS);
  if (todosEnteros) {
    const amplitud = maximo - minimo + 1;
    const base = Math.floor(amplitud / cantidad);
    const resto = amplitud % cantidad;
    const bins: Bin[] = [];
    let cursor = minimo;
    for (let i = 0; i < cantidad; i++) {
      const tamano = base + (i < resto ? 1 : 0);
      bins.push({ min: cursor, max: cursor + tamano, n: 0 });
      cursor += tamano;
    }
    for (const v of datos) {
      let i = bins.findIndex((b, k) => v >= b.min && (v < b.max || k === bins.length - 1));
      if (i < 0) i = 0;
      bins[Math.min(i, bins.length - 1)].n++;
    }
    return bins;
  }
  const tamano = (maximo - minimo) / cantidad;
  const bins: Bin[] = Array.from({ length: cantidad }, (_, i) => ({ min: minimo + i * tamano, max: minimo + (i + 1) * tamano, n: 0 }));
  for (const v of datos) bins[Math.min(cantidad - 1, Math.max(0, Math.floor((v - minimo) / tamano)))].n++;
  return bins;
}

export function etiquetaDeBin(bin: Bin, enteros: boolean): string {
  if (bin.etiqueta) return bin.etiqueta;
  if (enteros) {
    const bajo = bin.min;
    const alto = bin.max - 1;
    return alto <= bajo ? String(bajo) : `${bajo} – ${alto}`;
  }
  return `${formatearNumero(bin.min)} – ${formatearNumero(bin.max)}`;
}

// ── Período mes / año (storypad `StatsRange`, `StoryStatsService`) ───────────

export type TipoVentana = "mes" | "anio";
export interface Ventana {
  tipo: TipoVentana;
  inicio: string;
  /** Último día, inclusive. */
  fin: string;
  dias: number;
}

export function ventanaDe(tipo: TipoVentana, ancla: string): Ventana {
  const inicio = tipo === "mes" ? primeroDelMes(ancla) : primeroDelAnio(ancla);
  const fin = tipo === "mes" ? sumarDias(sumarMeses(inicio, 1), -1) : `${ancla.slice(0, 4)}-12-31`;
  return { tipo, inicio, fin, dias: diasEntre(inicio, fin) + 1 };
}

export const ventanaAnterior = (v: Ventana): Ventana => ventanaDe(v.tipo, sumarMeses(v.inicio, v.tipo === "mes" ? -1 : -12));
export const ventanaSiguiente = (v: Ventana): Ventana => ventanaDe(v.tipo, sumarMeses(v.inicio, v.tipo === "mes" ? 1 : 12));
export const ventanaContiene = (v: Ventana, fecha: string) => fecha >= v.inicio && fecha <= v.fin;

/** storypad `_elapsedDays`: los días del período contra los que se mide la actividad; en el período en curso, los transcurridos. */
export const diasTranscurridos = (v: Ventana, hoy: string): number => (ventanaContiene(v, hoy) ? diasEntre(v.inicio, hoy) + 1 : v.dias);

export interface EtiquetaCatalogo {
  id: number;
  grupoId: number | null;
}

export interface Ranking {
  /** null = etiquetas sueltas (sin grupo). */
  grupoId: number | null;
  items: { id: number; n: number }[];
}

export interface EstadisticasPeriodo {
  entradas: number;
  diasActivos: number;
  /** Días contra los que se mide (los transcurridos si el período está en curso). */
  diasTotales: number;
  palabras: number;
  fotos: number;
  /** Etiquetas más usadas, una lista por grupo (storypad: sentimientos, actividades…). El orden de los grupos sigue el de `etiquetas`. */
  rankings: Ranking[];
  categorias: { id: number; n: number }[];
  /** Entradas por día. */
  conteoDiario: Record<string, number>;
  /** Entradas por mes del año de la ventana (12 posiciones). */
  porMes: number[];
}

const porCantidad = <T extends { id: number; n: number }>(a: T, b: T) => b.n - a.n || a.id - b.id;

/** storypad `StoryStatsService.compute`: todo lo del período, de una sola pasada. */
export function estadisticasDelPeriodo(filas: FilaEstadistica[], ventana: Ventana, hoy: string, etiquetas: EtiquetaCatalogo[]): EstadisticasPeriodo {
  const porId = new Map(etiquetas.map((e) => [e.id, e]));
  const dias = new Set<string>();
  const conteoDiario: Record<string, number> = {};
  const porMes = Array<number>(12).fill(0);
  const usos = new Map<number, number>();
  const categorias = new Map<number, number>();
  let entradas = 0;
  let palabras = 0;
  let fotos = 0;
  for (const f of filas) {
    if (!ventanaContiene(ventana, f.fecha)) continue;
    entradas++;
    palabras += f.palabras;
    fotos += f.fotos;
    dias.add(f.fecha);
    conteoDiario[f.fecha] = (conteoDiario[f.fecha] ?? 0) + 1;
    porMes[Number(f.fecha.slice(5, 7)) - 1]++;
    for (const e of f.etiquetas) if (porId.has(e.id)) usos.set(e.id, (usos.get(e.id) ?? 0) + 1);
    if (f.categoriaId !== null) categorias.set(f.categoriaId, (categorias.get(f.categoriaId) ?? 0) + 1);
  }
  const porGrupo = new Map<number | null, { id: number; n: number }[]>();
  for (const [id, n] of usos) {
    const g = porId.get(id)!.grupoId;
    porGrupo.set(g, [...(porGrupo.get(g) ?? []), { id, n }]);
  }
  const rankings: Ranking[] = [...porGrupo.entries()]
    .map(([grupoId, items]) => ({ grupoId, items: items.sort(porCantidad) }))
    // Las etiquetas sueltas al final; los grupos, por su cantidad total de usos
    .sort((a, b) => (a.grupoId === null ? 1 : 0) - (b.grupoId === null ? 1 : 0) || b.items.reduce((s, i) => s + i.n, 0) - a.items.reduce((s, i) => s + i.n, 0));
  return {
    entradas,
    diasActivos: dias.size,
    diasTotales: diasTranscurridos(ventana, hoy),
    palabras,
    fotos,
    rankings,
    categorias: [...categorias].map(([id, n]) => ({ id, n })).sort(porCantidad),
    conteoDiario,
    porMes,
  };
}

// ── Período semana / mes / año (moodiary `mood_insights`) ────────────────────

export type Alcance = "semana" | "mes" | "anio";
export const ALCANCES: { valor: Alcance; titulo: string }[] = [
  { valor: "semana", titulo: "Semana" },
  { valor: "mes", titulo: "Mes" },
  { valor: "anio", titulo: "Año" },
];

/** moodiary `moodPeriodBounds`: [inicio, fin) — `fin` ya es el primer día fuera del período. La semana va de lunes a domingo. */
export function limitesDePeriodo(ancla: string, alcance: Alcance): { inicio: string; fin: string } {
  if (alcance === "semana") {
    const inicio = sumarDias(ancla, -diaSemana(ancla));
    return { inicio, fin: sumarDias(inicio, 7) };
  }
  if (alcance === "mes") return { inicio: primeroDelMes(ancla), fin: sumarMeses(primeroDelMes(ancla), 1) };
  return { inicio: primeroDelAnio(ancla), fin: sumarMeses(primeroDelAnio(ancla), 12) };
}

/** Ancla del período anterior (-1) o siguiente (+1). */
export function moverPeriodo(ancla: string, alcance: Alcance, n: number): string {
  const { inicio } = limitesDePeriodo(ancla, alcance);
  return alcance === "semana" ? sumarDias(inicio, 7 * n) : sumarMeses(inicio, (alcance === "mes" ? 1 : 12) * n);
}

export const filasDelPeriodo = (filas: FilaEstadistica[], inicio: string, fin: string): FilaEstadistica[] => filas.filter((f) => f.fecha >= inicio && f.fecha < fin);

export interface DiaAnimo {
  entradas: FilaEstadistica[];
  /** Promedio de los ánimos del día (null = ninguna entrada con ánimo). */
  promedio: number | null;
}

/** moodiary `moodDays`. */
export function diasDeAnimo(filas: FilaEstadistica[]): Record<string, DiaAnimo> {
  const agrupadas: Record<string, FilaEstadistica[]> = {};
  for (const f of filas) (agrupadas[f.fecha] ??= []).push(f);
  return Object.fromEntries(Object.entries(agrupadas).map(([fecha, entradas]) => [fecha, { entradas, promedio: promedio(entradas.flatMap((e) => (e.animo === null ? [] : [e.animo]))) }]));
}

export interface ResumenAnimo {
  dias: Record<string, DiaAnimo>;
  /** Promedio de los promedios de los días con ánimo. */
  promedio: number | null;
  entradas: number;
  diasRegistrados: number;
  /** Mayor racha de días seguidos con nivel «bien» o mejor. */
  mayorRachaBuena: number;
  distribucion: Record<number, number>;
}

/** moodiary `summarizeMood`. */
export function resumenAnimo(filas: FilaEstadistica[]): ResumenAnimo {
  const dias = diasDeAnimo(filas);
  const registrados = Object.entries(dias)
    .filter(([, d]) => d.promedio !== null)
    .sort(([a], [b]) => (a < b ? -1 : 1));
  let mayor = 0;
  let racha = 0;
  let previo: string | null = null;
  for (const [fecha, d] of registrados) {
    if (Math.round(d.promedio!) >= 4) {
      racha = previo !== null && sumarDias(previo, 1) === fecha ? racha + 1 : 1;
      if (racha > mayor) mayor = racha;
      previo = fecha;
    } else {
      racha = 0;
      previo = null;
    }
  }
  return {
    dias,
    promedio: promedio(registrados.map(([, d]) => d.promedio!)),
    entradas: filas.length,
    diasRegistrados: registrados.length,
    mayorRachaBuena: mayor,
    distribucion: totalesAnimo(filas),
  };
}

/** moodiary `moodPeriodDelta`: cuánto subió o bajó el promedio respecto del período anterior. */
export const diferencia = (actual: ResumenAnimo, anterior: ResumenAnimo): number | null => (actual.promedio === null || anterior.promedio === null ? null : actual.promedio - anterior.promedio);

/** moodiary `moodWeekdayAverages`: promedio de los días registrados por día de la semana (lunes primero) en [inicio, fin). */
export function promediosPorDiaSemana(filas: FilaEstadistica[], inicio: string, fin: string): (number | null)[] {
  const dias = diasDeAnimo(filasDelPeriodo(filas, inicio, fin));
  const porDia: number[][] = [[], [], [], [], [], [], []];
  for (const [fecha, d] of Object.entries(dias)) if (d.promedio !== null) porDia[diaSemana(fecha)].push(d.promedio);
  return porDia.map((v) => promedio(v));
}

/** moodiary `moodMonthAverages`: promedio de los promedios diarios de cada mes, con clave "YYYY-MM". */
export function promediosMensuales(filas: FilaEstadistica[]): Record<string, number | null> {
  const porMes: Record<string, number[]> = {};
  for (const [fecha, d] of Object.entries(diasDeAnimo(filas))) {
    const lista = (porMes[fecha.slice(0, 7)] ??= []);
    if (d.promedio !== null) lista.push(d.promedio);
  }
  return Object.fromEntries(Object.entries(porMes).map(([mes, v]) => [mes, promedio(v)]));
}

/** El día de mejor ánimo (el más reciente si hay empate), o null. */
export function mejorDia(dias: Record<string, DiaAnimo>): string | null {
  let mejor: string | null = null;
  for (const [fecha, d] of Object.entries(dias)) {
    if (d.promedio === null) continue;
    if (mejor === null || d.promedio > dias[mejor].promedio! || (d.promedio === dias[mejor].promedio && fecha > mejor)) mejor = fecha;
  }
  return mejor;
}
