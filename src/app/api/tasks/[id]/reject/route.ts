import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { registrarAccion } from "@/lib/historial";
import { updateUserCompletionPercentage } from "@/lib/userUtils";
import { limpiarFotoPruebaHuerfana } from "@/lib/tareas/fotoPruebaServidor";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { user } = session;
    const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";
    if (!isParent) {
      return NextResponse.json({ error: "Solo los padres pueden rechazar tareas" }, { status: 403 });
    }

    const { id } = await params;
    const taskId = Number(id);

    const task = await prisma.tarea.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    if (task.estado !== "Esperando_Aprobacion") {
      return NextResponse.json({ error: "La tarea no está esperando aprobación" }, { status: 400 });
    }

    // Transacción: Rechazar tarea y restar los puntos de LockedPoints
    await prisma.$transaction([
      prisma.tarea.update({
        where: { id: taskId, estado: "Esperando_Aprobacion" },
        data: { 
          estado: "Rechazada",
          puntosGenerados: 0,
          fechaCompletado: null,
          // Se pide una foto nueva si vuelve a completarse
          fotoPruebaUrl: null,
          fotoPruebaSubidaEn: null,
        }
      }),
      prisma.usuario.update({
        where: { id: task.asignadoId },
        data: {
          lockedPoints: { decrement: task.puntosGenerados }
        }
      }),
      registrarAccion(prisma, { tareaId: taskId, actorId: user.id, estadoAnterior: "Esperando_Aprobacion", estadoNuevo: "Rechazada" })
    ]);

    // Recalcular porcentaje de éxito (bajará porque ahora hay una rechazada)
    await updateUserCompletionPercentage(task.asignadoId);

    // La foto rechazada ya no se usa: se limpia el archivo si quedó huérfano
    await limpiarFotoPruebaHuerfana(task.fotoPruebaUrl).catch((error) => {
      console.error("No se pudo limpiar la foto de prueba rechazada:", error);
    });

    return NextResponse.json({ ok: true, mensaje: "Tarea rechazada. El usuario deberá re-hacerla." });
  } catch (error) {
    console.error("Error rechazando tarea:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
