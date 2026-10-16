// Compañero que evoluciona, lado servidor (lane 203). La etapa se calcula con los días de ingreso
// (`ActividadDia`); en la base solo queda el nombre que eligió el niño y la última etapa que festejó.
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { tz } from "@date-fns/tz";
import prisma from "../prisma.ts";
import { APP_TZ } from "../cartas/eventos.ts";
import { aClave, aFecha } from "../habitos/server.ts";
import { registrarIngreso, rachaDe } from "./servidor.ts";
import { avanceDeEtapa, etapaDe, hayEtapaNueva, mensajeDeRegreso, NOMBRE_POR_DEFECTO, proximaEtapa, validarNombre, type Etapa } from "./companero.ts";

export type CompaneroVista = {
  nombre: string;
  /** El niño ya le puso nombre */
  tieneNombre: boolean;
  etapa: Etapa;
  diasDeUso: number;
  /** Próxima etapa (null en la última) */
  proxima: { nombre: string; emoji: string; faltan: number } | null;
  /** Avance dentro de la etapa actual (0–100) */
  avance: number;
  /** Creció desde la última vez que lo festejó */
  nuevaEtapa: boolean;
  /** Mensaje cálido al volver después de faltar */
  regreso: string | null;
  racha: number;
};

export async function companeroDe(usuarioId: number, ahora: Date = new Date()): Promise<CompaneroVista> {
  const hoy = format(ahora, "yyyy-MM-dd", { in: tz(APP_TZ) });
  // Quien crea la fila del día es siempre registrarIngreso: así la etapa ya cuenta el día de hoy
  await registrarIngreso(usuarioId, ahora);

  const [fila, diasDeUso, previa, racha] = await Promise.all([
    prisma.companero.findUnique({ where: { usuarioId } }),
    prisma.actividadDia.count({ where: { usuarioId } }),
    prisma.actividadDia.findFirst({ where: { usuarioId, fecha: { lt: aFecha(hoy) } }, orderBy: { fecha: "desc" }, select: { fecha: true } }),
    rachaDe(usuarioId, ahora),
  ]);

  const nombre = fila?.nombre ?? NOMBRE_POR_DEFECTO;
  const sig = proximaEtapa(diasDeUso);
  const desdeLaUltimaVez = previa ? differenceInCalendarDays(parseISO(hoy), parseISO(aClave(previa.fecha))) : null;
  return {
    nombre,
    tieneNombre: fila !== null,
    etapa: etapaDe(diasDeUso),
    diasDeUso,
    proxima: sig ? { nombre: sig.etapa.nombre, emoji: sig.etapa.emoji, faltan: sig.faltan } : null,
    avance: avanceDeEtapa(diasDeUso),
    // Sin nombre todavía no hay nada que festejar: se estrena con el nombre
    nuevaEtapa: fila !== null && hayEtapaNueva(diasDeUso, fila.etapaVista),
    regreso: fila ? mensajeDeRegreso(nombre, desdeLaUltimaVez) : null,
    racha: racha.dias,
  };
}

/** El niño le pone (o le cambia) el nombre. Al crearlo, la etapa actual ya cuenta como vista. */
export async function nombrarCompanero(usuarioId: number, entrada: unknown) {
  const nombre = validarNombre(entrada);
  const dias = await prisma.actividadDia.count({ where: { usuarioId } });
  await prisma.companero.upsert({
    where: { usuarioId },
    create: { usuarioId, nombre, etapaVista: etapaDe(dias).numero },
    update: { nombre },
  });
}

/** El niño festejó la etapa nueva: no se vuelve a mostrar */
export async function festejarEtapa(usuarioId: number) {
  const dias = await prisma.actividadDia.count({ where: { usuarioId } });
  await prisma.companero.updateMany({ where: { usuarioId }, data: { etapaVista: etapaDe(dias).numero } });
}
