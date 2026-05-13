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

    const { id } = await params;
    const taskId = Number(id);
    const { elapsedSeconds } = await req.json();

    const task = await prisma.tarea.findUnique({ 
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    if (task.estado === "Completada" || task.estado === "Aprobada" || task.estado === "Esperando_Aprobacion") {
      return NextResponse.json({ error: "La tarea ya fue completada o está en revisión" }, { status: 400 });
    }

    const cleanElapsed = Math.round(Number(elapsedSeconds) || 0);
    const now = new Date();

    // Transacción: actualizamos la tarea a 'Expirada'
    await prisma.tarea.update({
      where: { id: taskId },
      data: {
        estado: "Expirada",
        tiempoRealEjecucionSeg: cleanElapsed,
        tiempoConsumidoTotalSeg: { increment: cleanElapsed },
        fechaCompletado: now,
        puntosGenerados: 0,
        retroalimentacionAlgoritmo: "Marcada voluntariamente como no realizada.",
        timerStartedAt: null,
        tiempoAcumuladoTimer: 0,
      }
    });

    // Recalcular porcentaje de éxito del usuario
    await updateUserCompletionPercentage(task.asignadoId);

    return NextResponse.json({ 
      ok: true, 
      mensaje: "Tarea marcada como no realizada. No se sumaron puntos.",
      estado: "Expirada"
    });
  } catch (error: any) {
    console.error("Error al marcar como no realizada:", error);
    return NextResponse.json({ error: "Error interno: " + (error?.message || String(error)) }, { status: 500 });
  }
}
