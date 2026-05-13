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
      return NextResponse.json({ error: "Solo los padres pueden aprobar tareas" }, { status: 403 });
    }

    const { id } = await params;
    const taskId = Number(id);

    const tarea = await prisma.tarea.findUnique({ where: { id: taskId } });
    if (!tarea) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    // Verificamos que la tarea esté en espera
    if (tarea.estado !== ("Esperando_Aprobacion" as any)) {
      return NextResponse.json({ error: "La tarea no está en revisión" }, { status: 400 });
    }

    // Transacción: Aprobar tarea y transferir puntos de Locked a Available
    await prisma.$transaction([
      prisma.tarea.update({
        where: { id: taskId },
        data: { estado: "Aprobada" as any }
      }),
      prisma.usuario.update({
        where: { id: tarea.asignadoId },
        data: {
          lockedPoints: { decrement: (tarea as any).puntosGenerados || 0 },
          availablePoints: { increment: (tarea as any).puntosGenerados || 0 },
          puntosAcumulados: { increment: (tarea as any).puntosGenerados || 0 }
        }
      })
    ]);

    // Recalcular porcentaje de éxito
    await updateUserCompletionPercentage(tarea.asignadoId);

    return NextResponse.json({ ok: true, mensaje: "Tarea aprobada y puntos acreditados" });
  } catch (error) {
    console.error("Error aprobando tarea:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
