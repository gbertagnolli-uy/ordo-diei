import { EstadoTarea, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Registra cada cambio de etapa de una tarea con su fecha y hora (HistorialAccion.timestamp),
// para poder medir cuánto tarda en pasar de una etapa a otra.
export function registrarAccion(
  tx: Prisma.TransactionClient | typeof prisma,
  data: { tareaId: number; actorId: number; estadoAnterior: EstadoTarea | null; estadoNuevo: EstadoTarea; duracionSesionSeg?: number | null }
) {
  return tx.historialAccion.create({ data });
}
