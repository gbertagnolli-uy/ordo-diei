import prisma from "./prisma";

/**
 * Recalcula el porcentaje de completitud para un usuario.
 * @param userId ID del usuario
 * @returns El nuevo porcentaje calculado
 */
export async function updateUserCompletionPercentage(userId: number) {
  // Definición: 
  // Éxitos = Aprobada + Completada + Esperando_Aprobacion (porque el chico ya hizo su parte)
  // Base = Todas las tareas que ya vencieron o están en un estado final
  
  const now = new Date();
  
  const tasks = await prisma.tarea.findMany({
    where: { 
      asignadoId: userId,
      OR: [
        { estado: { in: ["Aprobada", "Completada", "Esperando_Aprobacion", "Vencida", "Rechazada", "Expirada"] } },
        { 
          estado: "Pendiente",
          OR: [
            { fechaVencimiento: { lte: now } },
            { horaEjecucion: { lte: now } }
          ]
        }
      ]
    },
    select: { estado: true }
  });

  const exitos = tasks.filter(t => 
    ["Aprobada", "Completada", "Esperando_Aprobacion"].includes(t.estado)
  ).length;

  const total = tasks.length;

  let percentage = 0;
  if (total > 0) {
    percentage = Math.round((exitos / total) * 100);
  }

  await prisma.usuario.update({
    where: { id: userId },
    data: { completionPercentage: percentage }
  });

  return percentage;
}
