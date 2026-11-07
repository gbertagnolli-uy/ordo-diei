// Rutina familiar en la base (lane 259): una sola fila, id = 1.
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { EtapaRutina, RutinaSemanalConfig } from "./tipos";

export interface RutinaFamiliarGuardada {
  etapas: EtapaRutina[];
  semanalConfig: RutinaSemanalConfig;
  version: number;
}

export async function leerRutinaFamiliar(): Promise<RutinaFamiliarGuardada | null> {
  const fila = await prisma.rutinaFamiliar.findUnique({ where: { id: 1 } });
  if (!fila) return null;
  return {
    etapas: fila.etapas as unknown as EtapaRutina[],
    semanalConfig: fila.semanalConfig as unknown as RutinaSemanalConfig,
    version: fila.version,
  };
}

export async function guardarRutinaFamiliar(
  etapas: EtapaRutina[],
  semanalConfig: RutinaSemanalConfig,
  usuarioId: number
): Promise<RutinaFamiliarGuardada> {
  const datos = {
    etapas: etapas as unknown as Prisma.InputJsonValue,
    semanalConfig: semanalConfig as unknown as Prisma.InputJsonValue,
    actualizadoPorId: usuarioId,
  };
  const fila = await prisma.rutinaFamiliar.upsert({
    where: { id: 1 },
    create: { id: 1, ...datos },
    update: { ...datos, version: { increment: 1 } },
  });
  return { etapas, semanalConfig, version: fila.version };
}
