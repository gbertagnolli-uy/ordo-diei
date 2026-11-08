// Diario (lane 286), lado servidor: escala de ánimo. Personal = la de cada persona; familiar = una sola para toda la familia (la cambia un padre).
// Portado de vendor/Daily_You/lib/database/mood_scale_dao.dart y lib/providers/mood_scale_provider.dart (Demizo/Daily_You@7cc237d).
import prisma from "@/lib/prisma";
import { NoAutorizadoError } from "@/lib/habitos/server";
import { ESCALA_PREDETERMINADA, completarEscala, puedeCambiarEscala, validarEscala, type EscalaAnimo } from "./escala";
import type { Actor } from "./etiquetas";
import type { TipoDiario } from "./reglas";

/** Dueño de la escala: la persona en el personal, 0 en el familiar. */
const duenoDe = (actor: Actor, tipo: TipoDiario) => (tipo === "personal" ? actor.id : 0);

export async function leerEscala(actor: Actor, tipo: TipoDiario): Promise<EscalaAnimo> {
  const filas = await prisma.diarioEscalaAnimo.findMany({ where: { ambito: tipo, duenoId: duenoDe(actor, tipo) } });
  return completarEscala(filas);
}

function exigirPermiso(actor: Actor, tipo: TipoDiario) {
  if (!puedeCambiarEscala(tipo, actor)) throw new NoAutorizadoError("Solo un padre puede cambiar la escala de ánimo de la familia");
}

/** Daily You `MoodScaleDao.save`: reemplaza los 5 niveles. */
export async function guardarEscala(actor: Actor, tipo: TipoDiario, body: Record<string, unknown>): Promise<EscalaAnimo> {
  exigirPermiso(actor, tipo);
  const niveles = validarEscala(body);
  const duenoId = duenoDe(actor, tipo);
  await prisma.$transaction(
    niveles.map((n) => {
      const datos = { etiqueta: n.etiqueta, icono: n.icono, tipoIcono: n.tipoIcono, color: n.color };
      return prisma.diarioEscalaAnimo.upsert({
        where: { ambito_duenoId_animo: { ambito: tipo, duenoId, animo: n.valor } },
        create: { ambito: tipo, duenoId, animo: n.valor, ...datos },
        update: datos,
      });
    }),
  );
  return leerEscala(actor, tipo);
}

/** Vuelve a la escala predeterminada (se borran las filas guardadas). */
export async function restablecerEscala(actor: Actor, tipo: TipoDiario): Promise<EscalaAnimo> {
  exigirPermiso(actor, tipo);
  await prisma.diarioEscalaAnimo.deleteMany({ where: { ambito: tipo, duenoId: duenoDe(actor, tipo) } });
  return ESCALA_PREDETERMINADA;
}
