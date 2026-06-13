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

    const estadoFinal = "Esperando_Aprobacion";

    // Lógica de Rachas (Streaks)
    const asignado = await prisma.usuario.findUnique({ where: { id: task.asignadoId } });
    let isNewStreak = false;
    let newStreakDays = asignado?.streakDays || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (asignado && task.generaPuntosYRecompensa) {
      const lastDate = asignado.lastTaskCompletedDate;
      if (!lastDate) {
        newStreakDays = 1;
        isNewStreak = true;
      } else {
        const last = new Date(lastDate);
        last.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(today.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Día consecutivo
          newStreakDays += 1;
          isNewStreak = true;
        } else if (diffDays > 1) {
          // Racha rota
          newStreakDays = 1;
          isNewStreak = true;
        }
        // Si diffDays === 0, ya hizo algo hoy, la racha se mantiene igual
      }
    }

    // Regla de Recompensa

    let rewardPoints = 0;
    let feedback = "";
    let basePointsEarned = 0;
    let streakBonusEarned = 0;

    if (task.generaPuntosYRecompensa) {
      // Dynamic base points based on estimated time (1 point per minute, minimum 10)
      let basePoints = Math.max(10, Math.floor((task.tiempoEjecucionEstimadoSeg || 0) / 60));

      // Happy Hour Bonus (15:00 - 18:00 local time assumption)
      const currentHour = new Date().getHours();
      let isHappyHour = currentHour >= 15 && currentHour < 18;
      if (isHappyHour) {
          basePoints = Math.floor(basePoints * 1.5);
      }

      // Streak bonus: +2 points per streak day, max +20 points
      const streakBonus = Math.max(0, Math.min(20, (newStreakDays - 1) * 2));

      // Checklist Bonus
      let checklistBonus = 0;
      if (task.isChecklist && task.checklistItems && task.checklistItems.length > 0) {
          const completedItems = task.checklistItems.filter(ci => ci.completado).length;
          checklistBonus = completedItems * 5; // 5 pts por cada item
      }

      if (esATiempo) {
        rewardPoints = basePoints + streakBonus + checklistBonus;
        feedback = `¡Buen trabajo! Completaste la tarea a tiempo. Obtuviste ${basePoints} pts base ${isHappyHour ? '(Happy Hour x1.5!) ' : ''}y ${streakBonus} pts de bono por racha${checklistBonus > 0 ? ` + ${checklistBonus} pts por checklist` : ''}.`;
      } else if (estaEnPeriodoGracia) {
        rewardPoints = Math.floor((basePoints + streakBonus + checklistBonus) / 2);
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
          },
          streakDays: newStreakDays,
          lastTaskCompletedDate: now
        }
      })
    ]);

    // Recalcular porcentaje de éxito del usuario
    await updateUserCompletionPercentage(task.asignadoId);

    return NextResponse.json({ 
      ok: true, 
      mensaje: feedback, 
      puntos: rewardPoints,
      basePoints: basePointsEarned,
      streakBonus: streakBonusEarned,
      estado: "Esperando_Aprobacion",
      isNewStreak,
      streakDays: newStreakDays
    });
  } catch (error) {
    console.error("Error en finalización de tarea:", error);
    return NextResponse.json({ error: "Error interno: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
