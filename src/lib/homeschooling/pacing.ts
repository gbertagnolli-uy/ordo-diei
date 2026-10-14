// Reparto de unidades (páginas, lecciones…) entre los días lectivos. Puro: sin Date.now() ni Prisma.
// Reglas: ARQUITECTURA_DETALLADA §4. Fechas como 'YYYY-MM-DD'; días de la semana ISO (1=lunes … 7=domingo).
import { addDays, format, getISODay, parseISO } from "date-fns";
import { MAX_POR_DIA } from "./config.ts";

export type UnidadTipo = keyof typeof MAX_POR_DIA;

export type EntradaPacing = {
  totalUnidades: number;
  /** Unidades ya cubiertas por días conservados: el reparto numera desde base+1 */
  unidadesBase: number;
  desde: string;
  hasta: string;
  diasSemana: number[];
  /** Incluye las fechas ocupadas por días conservados */
  noLectivos: string[];
  unidadTipo: UnidadTipo;
};

export type SalidaPacing = {
  dias: { fecha: string; unidadDesde: number; unidadHasta: number }[];
  diasDisponibles: number;
  pendientes: number;
  promedio: number;
  aviso?: { tipo: "sin_dias" | "sobrecarga"; promedio?: number; opciones: string[] };
};

const clave = (d: Date) => format(d, "yyyy-MM-dd");
const LIMITE_DIAS = 3660;

/** Fechas lectivas de [desde, hasta]: día ISO permitido y no excluido */
export function diasDisponibles(desde: string, hasta: string, diasSemana: number[], noLectivos: string[]): string[] {
  const salida: string[] = [];
  const excluidos = new Set(noLectivos);
  const permitidos = new Set(diasSemana);
  let d = parseISO(desde);
  for (let i = 0; i < LIMITE_DIAS && clave(d) <= hasta; i++, d = addDays(d, 1)) {
    if (permitidos.has(getISODay(d)) && !excluidos.has(clave(d))) salida.push(clave(d));
  }
  return salida;
}

/** Primera fecha > hasta con la que el promedio entra en el máximo diario; null si no se encuentra */
function finSugerido(e: EntradaPacing, pendientes: number, disponibles: number): string | null {
  const necesarios = Math.ceil(pendientes / MAX_POR_DIA[e.unidadTipo]);
  const permitidos = new Set(e.diasSemana);
  const excluidos = new Set(e.noLectivos);
  let cuenta = disponibles;
  let d = addDays(parseISO(e.hasta), 1);
  for (let i = 0; i < LIMITE_DIAS; i++, d = addDays(d, 1)) {
    if (permitidos.has(getISODay(d)) && !excluidos.has(clave(d))) cuenta++;
    if (cuenta >= necesarios) return clave(d);
  }
  return null;
}

export function repartir(e: EntradaPacing): SalidaPacing {
  const U = e.totalUnidades - e.unidadesBase;
  const fechas = diasDisponibles(e.desde, e.hasta, e.diasSemana, e.noLectivos);
  const D = fechas.length;
  if (U <= 0) return { dias: [], diasDisponibles: D, pendientes: 0, promedio: 0 };
  if (D === 0) {
    return {
      dias: [],
      diasDisponibles: 0,
      pendientes: U,
      promedio: 0,
      aviso: { tipo: "sin_dias", opciones: ["extender la fecha de fin", "sumar días de la semana"] },
    };
  }

  const dias: SalidaPacing["dias"] = [];
  let siguiente = e.unidadesBase + 1;
  for (let i = 0; i < D; i++) {
    const cantidad = Math.floor(((i + 1) * U) / D) - Math.floor((i * U) / D);
    if (cantidad <= 0) continue;
    dias.push({ fecha: fechas[i], unidadDesde: siguiente, unidadHasta: siguiente + cantidad - 1 });
    siguiente += cantidad;
  }

  const promedio = U / D;
  const salida: SalidaPacing = { dias, diasDisponibles: D, pendientes: U, promedio };
  if (promedio > MAX_POR_DIA[e.unidadTipo]) {
    const fin = finSugerido(e, U, D);
    const extra = !e.diasSemana.includes(6) ? "sábado" : !e.diasSemana.includes(7) ? "domingo" : null;
    salida.aviso = {
      tipo: "sobrecarga",
      promedio,
      opciones: [
        fin ? `extender hasta ${fin}` : "extender la fecha de fin",
        extra ? `sumar el ${extra}` : "sumar un día lectivo más",
        "aceptar el ritmo",
      ],
    };
  }
  return salida;
}
