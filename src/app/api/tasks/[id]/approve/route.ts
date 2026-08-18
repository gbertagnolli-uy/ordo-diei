import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { updateUserCompletionPercentage } from "@/lib/userUtils";

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

    const tarea = await prisma.tarea.findUnique({ where: { id: taskId }, include: { asignado: true } });
    const asignado = tarea?.asignado;
    const nivelAntes = Math.floor(Math.sqrt((asignado?.puntosAcumulados || 0) / 100)) + 1;
    if (!tarea) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    const asignado = await prisma.usuario.findUnique({ where: { id: tarea.asignadoId } });
    const nivelAntes = asignado ? Math.floor(Math.sqrt((asignado.puntosAcumulados || 0) / 100)) + 1 : 1;
    // Verificamos que la tarea esté en espera
    if (tarea.estado !== "Esperando_Aprobacion") {
      return NextResponse.json({ error: "La tarea no está en revisión" }, { status: 400 });
    }

    const asignado = await prisma.usuario.findUnique({ where: { id: tarea.asignadoId } });
    if (!asignado) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    const nivelAntes = Math.floor(Math.sqrt((asignado.puntosAcumulados || 0) / 100)) + 1;

    const pointsGained = tarea.puntosGenerados || 0;
    const bonusStars = Math.floor(pointsGained / 100);
    const nivelAntes = Math.floor(Math.sqrt((asignado.puntosAcumulados || 0) / 100)) + 1;

    const asignado = await prisma.usuario.findUnique({ where: { id: tarea.asignadoId } });
    if (!asignado) return NextResponse.json({ error: "Usuario asignado no encontrado" }, { status: 404 });

    const nivelAntes = Math.floor(Math.sqrt((asignado.puntosAcumulados || 0) / 100)) + 1;
    // Transacción: Aprobar tarea y transferir puntos de Locked a Available y subir logros
    await prisma.$transaction([
      prisma.tarea.update({
        where: { id: taskId, estado: "Esperando_Aprobacion" },
        data: { estado: "Aprobada" }
      }),
      prisma.usuario.update({
        where: { id: tarea.asignadoId },
        data: {
          lockedPoints: { decrement: pointsGained },
          availablePoints: { increment: pointsGained },
          puntosAcumulados: { increment: pointsGained },
          totalTasksCompleted: { increment: 1 },
          stars: { increment: bonusStars }
        }
      })
    ]);

    // Recalcular porcentaje de éxito
    await updateUserCompletionPercentage(tarea.asignadoId);

    // Get the updated user for level calculations and response
    const asignado = await prisma.usuario.findUnique({ where: { id: tarea.asignadoId } });

    // We need nivelAntes. Calculate it from points before addition
    const puntosAntes = (asignado?.puntosAcumulados || 0) - pointsGained;
    const nivelAntes = Math.floor(Math.sqrt(Math.max(0, puntosAntes) / 100)) + 1;

    // Calcular nivel después
    const asignado = await prisma.usuario.findUnique({ where: { id: tarea.asignadoId } });
    const nivelAntes = Math.floor(Math.sqrt(((asignado?.puntosAcumulados || 0) - pointsGained) / 100)) + 1;
    const nivelDespues = Math.floor(Math.sqrt(((asignado?.puntosAcumulados || 0)) / 100)) + 1;
    const leveledUp = nivelDespues > nivelAntes;

    return NextResponse.json({
      ok: true,
      mensaje: "Tarea aprobada y puntos acreditados",
      leveledUp,
      newLevel: nivelDespues,
      userName: asignado?.nombre
    });
  } catch (error) {
    console.error("Error aprobando tarea:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
