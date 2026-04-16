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

    const { id } = await params;
    const taskId = Number(id);
    const { elapsedSeconds } = await req.json();

    const task = await prisma.tarea.findUnique({ 
      where: { id: taskId },
      include: { checklistItems: true }
    });

    if (!task) {
      console.warn(`[API/Complete] Tarea ${taskId} no encontrada`);
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    if (task.estado === "Completada" || task.estado === "Aprobada" || task.estado === "Esperando_Aprobacion") {
      console.warn(`[API/Complete] Tarea ${taskId} ya estaba en estado ${task.estado}`);
      return NextResponse.json({ error: "La tarea ya fue completada o está en revisión" }, { status: 400 });
    }

    // Business Rule: Checklist completion is COMPUTED (100% required)
    if (task.isChecklist && task.checklistItems.length > 0) {
      const allDone = task.checklistItems.every(ci => ci.completado);
      if (!allDone) {
        const done = task.checklistItems.filter(ci => ci.completado).length;
        console.warn(`[API/Complete] Tarea ${taskId} tiene checklist incompleto (${done}/${task.checklistItems.length})`);
        return NextResponse.json({ 
          error: `Checklist incompleto: ${done}/${task.checklistItems.length} ítems completados. Debes tildar todo para poder finalizar.` 
        }, { status: 400 });
      }
    }

    const now = new Date();
    // Calcular fechaVencimientoReal = horaEjecucion + tiempoEstimado
    let fechaVencimientoReal = task.horaEjecucion;
    if (fechaVencimientoReal && task.tiempoEjecucionEstimadoSeg > 0) {
      fechaVencimientoReal = new Date(fechaVencimientoReal.getTime() + task.tiempoEjecucionEstimadoSeg * 1000);
    } else if (!fechaVencimientoReal && task.fechaVencimiento) {
      fechaVencimientoReal = new Date(task.fechaVencimiento);
    }

    // Calcular fechaLimite según tipo de recurrencia
    let fechaLimite: Date | null = null;
    if (fechaVencimientoReal) {
      fechaLimite = new Date(fechaVencimientoReal);
      // Agregar periodo de gracia según tipo
      if (task.tipoRecurrencia === "Diaria") {
        fechaLimite.setHours(22, 0, 0, 0); // misma fecha 22:00
      } else if (task.tipoRecurrencia === "Semanal") {
        fechaLimite.setHours(22, 0, 0, 0);
        fechaLimite.setDate(fechaLimite.getDate() + 1); // +24 hrs
      } else if (task.tipoRecurrencia === "Mensual_Fecha" || task.tipoRecurrencia === "Mensual_Ordinal") {
        fechaLimite.setHours(22, 0, 0, 0);
        fechaLimite.setDate(fechaLimite.getDate() + 3); // +72 hrs
      } else {
        // Unica: misma fecha 22:00
        fechaLimite.setHours(22, 0, 0, 0);
      }
    }

    const esATiempo = fechaVencimientoReal ? now <= new Date(fechaVencimientoReal) : true;
    const estaEnPeriodoGracia = fechaLimite ? now <= fechaLimite : false;

    // Defensivo: asegurar que elapsed es un Int
    const cleanElapsed = Math.round(Number(elapsedSeconds) || 0);

    // Regla de Recompensa
    let rewardPoints = 0;
    let feedback = "";
    let estadoFinal = "Esperando_Aprobacion";

    if (task.generaPuntosYRecompensa) {
      if (esATiempo) {
        rewardPoints = 50;
        feedback = "¡Buen trabajo! Completaste la tarea a tiempo.";
      } else if (estaEnPeriodoGracia) {
        rewardPoints = 25;
        feedback = "Tarea completada con retraso (50% puntos).";
      } else {
        rewardPoints = 0;
        feedback = "Tarea completada fuera del período de gracia. No hay puntos.";
      }
    } else {
      feedback = "Tarea marcada como realizada. No genera puntos.";
    }

    // Transacción: actualizamos la tarea y los puntos bloqueados del usuario
    await prisma.$transaction([
      prisma.tarea.update({
        where: { id: taskId },
        data: {
          estado: "Esperando_Aprobacion",
          tiempoRealEjecucionSeg: cleanElapsed,
          tiempoConsumidoTotalSeg: { increment: cleanElapsed },
          fechaCompletado: now,
          puntosGenerados: rewardPoints,
          retroalimentacionAlgoritmo: feedback,
          timerStartedAt: null,
          tiempoAcumuladoTimer: 0,
        }
      }),
      prisma.usuario.update({
        where: { id: task.asignadoId },
        data: {
          lockedPoints: {
            increment: rewardPoints
          }
        }
      })
    ]);

    // Recalcular porcentaje de éxito del usuario
    await updateUserCompletionPercentage(task.asignadoId);

    return NextResponse.json({ 
      ok: true, 
      mensaje: feedback, 
      puntos: rewardPoints,
      estado: "Esperando_Aprobacion"
    });
  } catch (error: any) {
    console.error("Error en finalización de tarea:", error);
    return NextResponse.json({ error: "Error interno: " + (error?.message || String(error)) }, { status: 500 });
  }
}
