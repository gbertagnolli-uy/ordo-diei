import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/users/history — Get completed tasks and rewards history for current user
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // Get completed tasks
    const completedTasks = await prisma.tarea.findMany({
      where: {
        asignadoId: userId,
        estado: { in: ["Completada", "Aprobada"] }
      },
      orderBy: { fechaCompletado: "desc" },
      take: 50,
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        estado: true,
        fechaCompletado: true,
        tiempoRealEjecucionSeg: true,
        puntosGenerados: true,
        isSurpriseEligible: true,
        retroalimentacionAlgoritmo: true,
      }
    });

    // Get reward history (actions by this user)
    const historial = await prisma.historialAccion.findMany({
      where: { actorId: userId },
      orderBy: { timestamp: "desc" },
      take: 50,
      include: {
        tarea: {
          select: { titulo: true }
        }
      }
    });

    // Get user stats
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        puntosAcumulados: true,
        availablePoints: true,
        lockedPoints: true,
        stars: true,
        surprises: true,
      }
    });

    return NextResponse.json({
      completedTasks: completedTasks.map(t => ({
        ...t,
        fechaCompletado: t.fechaCompletado?.toISOString() || null,
      })),
      historial: historial.map(h => ({
        ...h,
        timestamp: h.timestamp.toISOString(),
      })),
      stats: user,
    });
  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
