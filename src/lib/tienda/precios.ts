// Cálculo de precios de la Tienda: descuento por racha y saldos (SPEC §5)
import { costoConDescuento } from "../cartas/economia.ts";
import { CLAVES_MONEDA, type Costo, type OpcionPrecio, type Saldos } from "./monedas.ts";

/** El descuento por racha rebaja solo los puntos de la canasta (igual que los sobres) */
export function aplicarDescuento(opcion: OpcionPrecio, descuentoPct: number, activo: boolean): OpcionPrecio {
  if (!activo || descuentoPct <= 0) return opcion;
  return {
    costos: opcion.costos.map((c) =>
      c.moneda === "puntos" ? { ...c, monto: Math.max(1, costoConDescuento(c.monto, descuentoPct)) } : c
    ),
  };
}

/** Lo que falta en cada moneda para pagar la opción (solo las monedas en las que falta) */
export function faltantes(opcion: OpcionPrecio, saldos: Saldos): Costo[] {
  return opcion.costos
    .filter((c) => saldos[c.moneda] < c.monto)
    .map((c) => ({ moneda: c.moneda, monto: c.monto - saldos[c.moneda] }));
}

export const alcanza = (opcion: OpcionPrecio, saldos: Saldos): boolean => faltantes(opcion, saldos).length === 0;

/** Saldos después de pagar (no baja de 0: la validación real es atómica en el servidor) */
export function saldosTrasPagar(opcion: OpcionPrecio, saldos: Saldos): Saldos {
  const resto = { ...saldos };
  for (const c of opcion.costos) resto[c.moneda] = Math.max(0, resto[c.moneda] - c.monto);
  return resto;
}

export const saldosVacios = (): Saldos => Object.fromEntries(CLAVES_MONEDA.map((m) => [m, 0])) as Saldos;

/** Días que tarda en juntar los puntos de una opción, a un ritmo de puntos por día (ayuda para padres) */
export function diasParaJuntar(opcion: OpcionPrecio, puntosPorDia = 20): number | null {
  const puntos = opcion.costos.find((c) => c.moneda === "puntos")?.monto;
  return puntos ? Math.ceil(puntos / puntosPorDia) : null;
}
