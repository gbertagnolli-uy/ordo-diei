import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { updateUserCompletionPercentage } from "@/lib/userUtils.server";

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
        where: { id: taskId },
        data: { 
          estado: "Rechazada",
          puntosGenerados: 0,
          fechaCompletado: null
        }
      }),
      prisma.usuario.update({
        where: { id: task.asignadoId },
        data: {
          lockedPoints: { decrement: task.puntosGenerados }
        }
      })
    ]);

    // Recalcular porcentaje de éxito (bajará porque ahora hay una rechazada)
    await updateUserCompletionPercentage(task.asignadoId);

    return NextResponse.json({ ok: true, mensaje: "Tarea rechazada. El usuario deberá re-hacerla." });
  } catch (error) {
    console.error("Error rechazando tarea:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
