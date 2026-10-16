// Día con sanción, lado servidor (vault/LANE_200_SANCION_Y_ENGAGEMENT.md): consulta si el niño tiene
// un comportamiento negativo registrado en el día y bloquea lo que corresponde. Se evalúa en el momento,
// sin guardar nada: si un padre elimina el registro, los beneficios vuelven al instante.
import type { Prisma } from "@prisma/client";
import prisma from "../prisma.ts";
import { APP_TZ, inicioDelDiaEnTz } from "../cartas/eventos.ts";
import { errorBloqueo, type Bloqueo } from "./sancion.ts";

type Cliente = Prisma.TransactionClient | typeof prisma;

const HORA_MS = 3_600_000;

/** [desde, hasta) del día de la familia en el que cae `instante` */
export function rangoDelDia(instante: Date) {
  const desde = inicioDelDiaEnTz(instante, APP_TZ);
  // +36 h cae siempre dentro del día siguiente, aunque el día tenga 23 o 25 horas
  const hasta = inicioDelDiaEnTz(new Date(desde.getTime() + 36 * HORA_MS), APP_TZ);
  return { desde, hasta };
}

/** ¿Tiene sanción el día en que cae `instante`? (por defecto, hoy) */
export async function haySancion(cliente: Cliente, usuarioId: number, instante: Date = new Date()): Promise<boolean> {
  const { desde, hasta } = rangoDelDia(instante);
  const n = await cliente.comportamiento.count({
    where: { usuarioId, tipo: "Negativo", createdAt: { gte: desde, lt: hasta } },
  });
  return n > 0;
}

/** Corta la acción con un mensaje claro si hoy el usuario tiene sanción */
export async function exigirSinSancion(cliente: Cliente, usuarioId: number, que: Bloqueo, instante: Date = new Date()) {
  if (await haySancion(cliente, usuarioId, instante)) throw new Error(errorBloqueo(que));
}

/**
 * Un cofre ya entregado hoy se pierde cuando llega la sanción (si todavía no se abrió).
 * @returns cuántos cofres se retiraron.
 */
export async function retirarCofreDeHoy(cliente: Cliente, usuarioId: number, instante: Date = new Date()): Promise<number> {
  const origen = origenCofreDelDia(instante);
  const r = await cliente.recompensa.deleteMany({ where: { usuarioId, tipo: "cofre", estado: "disponible", origen } });
  return r.count;
}

/** Texto único que identifica el cofre de un día (evita dos cofres el mismo día) */
export const origenCofreDelDia = (instante: Date) => `Buen comportamiento · ${rangoDelDia(instante).desde.toISOString().slice(0, 10)}`;
