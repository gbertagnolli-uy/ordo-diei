// Estado de una tarjeta de la Tienda para quien la mira (SPEC §8). Precedencia fija y con tests.
import { alcanza, aplicarDescuento } from "./precios.ts";
import type { OpcionPrecio, Saldos } from "./monedas.ts";
import { todosCumplidos, type RequisitoEvaluado } from "./requisitos.ts";

export type EstadoProducto =
  | "oculto"
  | "bloqueado"
  | "proximamente"
  | "agotado"
  | "limite"
  | "sinSaldo"
  | "comprable";

export type PeriodoLimite = "siempre" | "dia" | "semana" | "mes";

export interface DatosEstado {
  activo: boolean;
  destinatarios: number[] | null;
  usuarioId: number;
  disponibleDesde: Date | null;
  disponibleHasta: Date | null;
  stockRestante: number | null;
  limiteUsuario: number | null;
  periodoLimite: PeriodoLimite;
  descuentoRacha: boolean;
  precios: OpcionPrecio[];
}

export interface EntornoEstado {
  ahora: Date;
  saldos: Saldos;
  descuentoPct: number;
  requisitos: RequisitoEvaluado[];
  /** Compras de esta persona dentro del período del límite */
  comprasEnPeriodo: number;
}

export interface ResultadoEstado {
  estado: EstadoProducto;
  /** Precio final por opción (con descuento) y si alcanza */
  opciones: { opcion: OpcionPrecio; alcanza: boolean }[];
  /** Primera opción que alcanza (índice) o -1 */
  opcionSugerida: number;
  /** Cuándo vuelve a poder comprar (límite por período) */
  proximaCompra: Date | null;
}

/** Inicio del período del límite (semana desde el lunes), en la hora que recibe */
export function inicioPeriodo(periodo: PeriodoLimite, ahora: Date): Date | null {
  if (periodo === "siempre") return null;
  const d = new Date(ahora);
  d.setHours(0, 0, 0, 0);
  if (periodo === "semana") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (periodo === "mes") d.setDate(1);
  return d;
}

export function finPeriodo(periodo: PeriodoLimite, ahora: Date): Date | null {
  const ini = inicioPeriodo(periodo, ahora);
  if (!ini) return null;
  const fin = new Date(ini);
  if (periodo === "dia") fin.setDate(fin.getDate() + 1);
  if (periodo === "semana") fin.setDate(fin.getDate() + 7);
  if (periodo === "mes") fin.setMonth(fin.getMonth() + 1);
  return fin;
}

export function estadoProducto(p: DatosEstado, env: EntornoEstado): ResultadoEstado {
  const opciones = p.precios.map((o) => {
    const final = aplicarDescuento(o, env.descuentoPct, p.descuentoRacha);
    return { opcion: final, alcanza: alcanza(final, env.saldos) };
  });
  const base = { opciones, opcionSugerida: opciones.findIndex((o) => o.alcanza), proximaCompra: null as Date | null };

  // 1. Oculto: inactivo, vencido o no es para esta persona (la administración usa su propia lista)
  if (!p.activo) return { ...base, estado: "oculto" };
  if (p.destinatarios && p.destinatarios.length > 0 && !p.destinatarios.includes(p.usuarioId)) return { ...base, estado: "oculto" };
  if (p.disponibleHasta && env.ahora > p.disponibleHasta) return { ...base, estado: "oculto" };
  // 2. Bloqueado por requisitos
  if (!todosCumplidos(env.requisitos)) return { ...base, estado: "bloqueado" };
  // 3. Todavía no empieza
  if (p.disponibleDesde && env.ahora < p.disponibleDesde) return { ...base, estado: "proximamente" };
  // 4. Agotado
  if (p.stockRestante !== null && p.stockRestante <= 0) return { ...base, estado: "agotado" };
  // 5. Alcanzó su límite del período
  if (p.limiteUsuario !== null && env.comprasEnPeriodo >= p.limiteUsuario) {
    return { ...base, estado: "limite", proximaCompra: finPeriodo(p.periodoLimite, env.ahora) };
  }
  // 6/7. Saldo
  return { ...base, estado: base.opcionSugerida >= 0 ? "comprable" : "sinSaldo" };
}
