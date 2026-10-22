import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { registrarAccion } from "@/lib/historial";
import { updateUserCompletionPercentage } from "@/lib/userUtils";
import { nivelDe, xpTotal } from "@/lib/niveles";
import { reclamarSubidaNivel } from "@/lib/nivelesServidor";
import { claveDeUrl } from "@/lib/archivos";

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
    if (!tarea) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

    // Verificamos que la tarea esté en espera
    if (tarea.estado !== "Esperando_Aprobacion") {
      return NextResponse.json({ error: "La tarea no está en revisión" }, { status: 400 });
    }

    // Defensivo: una tarea con foto obligatoria no se aprueba sin la foto
    if (tarea.requiereFotoPrueba && !claveDeUrl(tarea.fotoPruebaUrl)) {
      return NextResponse.json({ error: "La tarea no tiene la foto de prueba obligatoria" }, { status: 400 });
    }

    const asignado = tarea.asignado;
    if (!asignado) return NextResponse.json({ error: "Usuario asignado no encontrado" }, { status: 404 });

    const nivelAntes = nivelDe(xpTotal(asignado)).level;
    const pointsGained = tarea.puntosGenerados || 0;
    const bonusStars = Math.floor(pointsGained / 100);

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
      }),
      registrarAccion(prisma, { tareaId: taskId, actorId: user.id, estadoAnterior: "Esperando_Aprobacion", estadoNuevo: "Aprobada" })
    ]);

    // Recalcular porcentaje de éxito
    await updateUserCompletionPercentage(tarea.asignadoId);

    // Get the updated user for level calculations and response
    const asignadoActualizado = await prisma.usuario.findUnique({ where: { id: tarea.asignadoId } });
    const infoDespues = nivelDe(xpTotal(asignadoActualizado));
    const nivelDespues = infoDespues.level;
    const leveledUp = nivelDespues > nivelAntes;

    if (leveledUp) {
      await reclamarSubidaNivel(tarea.asignadoId, nivelAntes);
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Tarea aprobada y puntos acreditados",
      leveledUp: false, // La notificación la ve el propio usuario al entrar (NavUser)
      newLevel: nivelDespues,
      userName: asignadoActualizado?.nombre
    });
  } catch (error) {
    console.error("Error aprobando tarea:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
