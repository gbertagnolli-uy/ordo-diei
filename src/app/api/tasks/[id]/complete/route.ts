import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { registrarAccion } from "@/lib/historial";
import { updateUserCompletionPercentage } from "@/lib/userUtils";
import { calcularPuntosCompletadoTarea } from "@/lib/recompensaTarea";
import { estrellasPorRacha } from "@/lib/cartas/racha";
import { puedeCompletarTarea } from "@/lib/tareas/permisos";
import { motivoBloqueoTarea } from "@/lib/homeschooling/servidor/guardia";
import { haySancion } from "@/lib/comportamiento/sancionServer";
import { AVISO_MITAD, mitad } from "@/lib/comportamiento/sancion";
import { infoRankingDeUsuario } from "@/lib/engagement/servidor";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = Number(id);
    const body = await req.json().catch(() => ({}));
    const { elapsedSeconds, modoCompletado } = body;

    const task = await prisma.tarea.findUnique({ 
      where: { id: taskId },
      include: { checklistItems: true }
    });

    if (!task) {
      console.warn(`[API/Complete] Tarea ${taskId} no encontrada`);
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    if (!puedeCompletarTarea({ id: Number(session.user.id), rolFamiliar: session.user.rolFamiliar }, task)) {
      return NextResponse.json({ error: "Solo quien tiene asignada la tarea (o un padre) puede completarla" }, { status: 403 });
    }

    if (task.estado === "Completada" || task.estado === "Aprobada" || task.estado === "Esperando_Aprobacion") {
      console.warn(`[API/Complete] Tarea ${taskId} ya estaba en estado ${task.estado}`);
      return NextResponse.json({ error: "La tarea ya fue completada o está en revisión" }, { status: 400 });
    }

    // Homeschooling: la Tarea de un día lectivo exige haber hecho sus lecciones
    const motivoHs = await motivoBloqueoTarea(taskId);
    if (motivoHs) return NextResponse.json({ error: motivoHs }, { status: 400 });

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

    const currentHour = now.getUTCHours();
    const isHappyHour = currentHour >= 17 && currentHour < 19;
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const esATiempo = fechaVencimientoReal ? now <= new Date(fechaVencimientoReal) : true;

    // Defensivo: asegurar que elapsed es un Int
    const cleanElapsed = Math.round(Number(elapsedSeconds) || 0);

    // Determinar si la persona presionó Iniciar -> hizo la tarea -> presionó Finalizar
    let tuvoInicioEnHistorial = false;
    if (
      !task.timerStartedAt &&
      (task.tiempoAcumuladoTimer ?? 0) === 0 &&
      task.estado !== "En_progreso" &&
      task.estado !== "Pausada" &&
      cleanElapsed === 0 &&
      modoCompletado !== "realizada_directa"
    ) {
      const inicioPrevio = await prisma.historialAccion.findFirst({
        where: { tareaId: taskId, estadoNuevo: "En_progreso" },
        select: { id: true },
      });
      tuvoInicioEnHistorial = Boolean(inicioPrevio);
    }

    const fueIniciada =
      modoCompletado === "realizada_directa"
        ? false
        : Boolean(task.timerStartedAt) ||
          (task.tiempoAcumuladoTimer ?? 0) > 0 ||
          task.estado === "En_progreso" ||
          task.estado === "Pausada" ||
          cleanElapsed > 0 ||
          tuvoInicioEnHistorial;

    // Lógica de Rachas (Streaks)
    const asignado = await prisma.usuario.findUnique({ where: { id: task.asignadoId } });
    let isNewStreak = false;
    let newStreakDays = asignado?.streakDays || 0;

    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);

    if (asignado) {
      const lastDate = asignado.lastTaskCompletedDate;
      if (!lastDate) {
        newStreakDays = 1;
        isNewStreak = true;
      } else {
        const last = new Date(lastDate);
        last.setUTCHours(0, 0, 0, 0);

        const diffTime = Math.abs(todayDate.getTime() - last.getTime());
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

    const infoRanking = await infoRankingDeUsuario(task.asignadoId, now).catch(() => null);

    // Regla de Recompensa: 100% si Iniciar -> Hacerla -> Finalizar, 80% si solo marca realizada / fuera de horario
    // + acelerador del podio (1ro: +5%, 2do: +3%, 3ro: +1%) mientras esté en ese puesto
    const calculo = calcularPuntosCompletadoTarea({
      generaPuntosYRecompensa: task.generaPuntosYRecompensa,
      dificultad: task.dificultad,
      tiempoEjecucionEstimadoSeg: task.tiempoEjecucionEstimadoSeg,
      newStreakDays,
      isChecklist: task.isChecklist,
      checklistCompletados: task.checklistItems ? task.checklistItems.filter((ci) => ci.completado).length : 0,
      isWeekend,
      isHappyHour,
      fueIniciada,
      esATiempo,
      puestoRanking: infoRanking?.puestoRanking ?? null,
      aceleradorRankingPct: infoRanking?.aceleradorPct ?? 0,
    });

    let rewardPoints = calculo.rewardPoints;
    let feedback = calculo.feedback;
    const actualBasePoints = calculo.basePoints;
    const actualStreakBonus = calculo.streakBonus;
    const actualChecklistBonus = calculo.checklistBonus;
    const actualRankingBonus = calculo.rankingBonus;

    let wonSurprise = false;
    // 1 estrella cada 7 días de racha (vault/ECONOMIA_CARTAS.md §8): la racha solo sube al cambiar de día
    let earnedStars = isNewStreak ? estrellasPorRacha(asignado?.streakDays ?? 0, newStreakDays) : 0;

    // Día con sanción (vault/LANE_200_SANCION_Y_ENGAGEMENT.md): puntos y estrellas valen la mitad
    if (await haySancion(prisma, task.asignadoId, now)) {
      if (rewardPoints > 0 || earnedStars > 0) feedback += ` ${AVISO_MITAD}`;
      rewardPoints = mitad(rewardPoints);
      earnedStars = mitad(earnedStars);
    }
    if (earnedStars > 0) {
      feedback += ` ¡Ganaste ${earnedStars} ${earnedStars === 1 ? "Estrella" : "Estrellas"} por tu racha de ${newStreakDays} días!`;
    }

    // Transacción: actualizamos la tarea y los puntos bloqueados del usuario
    await prisma.$transaction([
      prisma.tarea.update({
        where: { id: taskId, estado: task.estado },
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
          stars: { increment: earnedStars },
          lastTaskCompletedDate: now,
          surprises: {
            increment: wonSurprise ? 1 : 0
          }
        }
      }),
      registrarAccion(prisma, { tareaId: taskId, actorId: session.user.id, estadoAnterior: task.estado, estadoNuevo: "Esperando_Aprobacion", duracionSesionSeg: cleanElapsed })
    ]);

    // Anclaje al completado: la regla de la serie cuenta desde esta acción del usuario
    const reglaId = task.parentTaskId ?? task.id;
    await prisma.tarea.updateMany({ where: { id: reglaId, anclaCompletado: true }, data: { anclaFecha: now } });

    // Recalcular porcentaje de éxito del usuario
    await updateUserCompletionPercentage(task.asignadoId);

    return NextResponse.json({ 
      ok: true, 
      mensaje: feedback, 
      puntos: rewardPoints,
      basePoints: actualBasePoints,
      streakBonus: actualStreakBonus,
      speedBonus: 0,
      checklistBonus: actualChecklistBonus,
      rankingBonus: actualRankingBonus,
      aceleradorRankingPct: calculo.aceleradorRankingPct,
      puestoRanking: infoRanking?.puestoRanking ?? null,
      emojiPodio: infoRanking?.emojiPodio ?? null,
      porcentajePuntos: calculo.porcentajeAplicado,
      fueIniciada,
      estado: "Esperando_Aprobacion",
      isNewStreak,
      streakDays: newStreakDays,
      earnedStars,
      isHappyHour
    });
  } catch (error) {
    console.error("Error en finalización de tarea:", error);
    return NextResponse.json({ error: "Error interno: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
