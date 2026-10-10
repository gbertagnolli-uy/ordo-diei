import prisma from "@/lib/prisma";
import { calcularPlan, type EstadoPlan, type HabitoId, type Marca } from "./engine";
import { APP_TZ, DIAS_EDITABLES, hoyEnFamilia, fechaEditable, aClave, aFecha } from "@/lib/habitos/server";

export { APP_TZ, DIAS_EDITABLES, hoyEnFamilia, fechaEditable };
export const HABITOS_VALIDOS: HabitoId[] = ["completorium", "rosario", "matutinum"];

export type EstadoOracion = { usuarioId: number; plan: EstadoPlan | null };

export async function getEstadoOracion(usuarioId: number): Promise<EstadoOracion> {
  return (await getEstadosOracion([usuarioId]))[0];
}

export async function getEstadosOracion(usuarioIds: number[]): Promise<EstadoOracion[]> {
  const hoy = hoyEnFamilia();
  const [planes, registros] = await Promise.all([
    prisma.planOracion.findMany({ where: { usuarioId: { in: usuarioIds } } }),
    prisma.registroOracion.findMany({
      where: { usuarioId: { in: usuarioIds } },
      select: { usuarioId: true, habito: true, fecha: true, marca: true },
    }),
  ]);

  return usuarioIds.map((usuarioId) => {
    const plan = planes.find((p) => p.usuarioId === usuarioId);
    if (!plan) return { usuarioId, plan: null };
    return {
      usuarioId,
      plan: calcularPlan({
        inicio: aClave(plan.inicio),
        matutinumDesde: plan.matutinumDesde ? aClave(plan.matutinumDesde) : null,
        hoy,
        registros: registros
          .filter((r) => r.usuarioId === usuarioId)
          .map((r) => ({ habito: r.habito as HabitoId, fecha: aClave(r.fecha), marca: r.marca as Marca })),
      }),
    };
  });
}

/** Crea el plan (inicio = hoy) o ajusta la habilitación de la mañana */
export async function guardarPlan(usuarioId: number, cambios: { matutinumDesde?: string | null } = {}) {
  const matutinumDesde = cambios.matutinumDesde === undefined ? undefined : cambios.matutinumDesde ? aFecha(cambios.matutinumDesde) : null;
  await prisma.planOracion.upsert({
    where: { usuarioId },
    create: { usuarioId, inicio: aFecha(hoyEnFamilia()), matutinumDesde: matutinumDesde ?? null },
    update: matutinumDesde === undefined ? {} : { matutinumDesde },
  });
}

/** Registra (o borra, con marca null) una oración para uno o varios usuarios */
export async function registrarOracion(input: {
  actorId: number;
  usuarioIds: number[];
  habito: HabitoId;
  fecha: string;
  marca: Marca | null;
  motivo?: string | null;
}) {
  const fecha = aFecha(input.fecha);
  await prisma.$transaction(
    input.usuarioIds.map((usuarioId) =>
      input.marca === null
        ? prisma.registroOracion.deleteMany({ where: { usuarioId, habito: input.habito, fecha } })
        : prisma.registroOracion.upsert({
            where: { usuarioId_habito_fecha: { usuarioId, habito: input.habito, fecha } },
            create: { usuarioId, habito: input.habito, fecha, marca: input.marca, motivo: input.motivo ?? null, registradoPorId: input.actorId },
            update: { marca: input.marca, motivo: input.motivo ?? null, registradoPorId: input.actorId },
          })
    )
  );
}
