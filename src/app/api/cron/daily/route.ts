import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { updateUserCompletionPercentage } from "@/lib/userUtils";

export const dynamic = "force-dynamic";

function getFechaLimite(fechaVenc: Date, tipoRecurrencia: string): Date {
  const limite = new Date(fechaVenc);
  
  if (tipoRecurrencia === "Semanal") {
    limite.setDate(limite.getDate() + 1);
  } else if (tipoRecurrencia === "Mensual_Fecha" || tipoRecurrencia === "Mensual_Ordinal") {
    limite.setDate(limite.getDate() + 3);
  }
  limite.setHours(22, 0, 0, 0);
  
  return limite;
}

export async function GET(req: Request) {
  const startTime = Date.now();
  const now = new Date();
  
  try {
    console.log("[Cron Daily] Iniciando...");

    // =====================
    // A) EXPIRAR TAREAS
    // =====================
    const tareasPendiente = await prisma.tarea.findMany({
      where: { estado: { in: ["Pendiente", "En_progreso"] } },
      select: { id: true, horaEjecucion: true, fechaVencimiento: true, tipoRecurrencia: true }
    });

    let expiradasCount = 0;
    for (const tarea of tareasPendiente) {
      const fechaVenc = tarea.horaEjecucion || tarea.fechaVencimiento;
      if (!fechaVenc) continue;
      
      const limite = getFechaLimite(new Date(fechaVenc), tarea.tipoRecurrencia);
      if (now > limite) {
        await prisma.tarea.update({
          where: { id: tarea.id },
          data: { estado: "No_Realizada", retroalimentacionAlgoritmo: "Venció sin entrega" }
        });
        expiradasCount++;
      }
    }

    console.log(`[Cron Daily] ${expiradasCount} expiradas`);

    // =====================
    // B) GENERAR TAREAS PARA HOY
    // =====================
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    // Solo tareas recurrentes "cabeza" (no generadas por cron)
    const plantillas = await prisma.tarea.findMany({
      where: { tipoRecurrencia: { not: "Unica" }, generadaPorCron: false },
      take: 20
    });

    let generadasCount = 0;
    for (const plantilla of plantillas) {
      // Solo crear si está completada/aprobada o vencida
      if (!["Completada", "Aprobada", "Vencida", "Expirada", "No_Realizada"].includes(plantilla.estado)) {
        continue;
      }

      // Verificar si ya existe tarea para HOY
      const yaExiste = await prisma.tarea.findFirst({
        where: { parentTaskId: plantilla.id, fechaVencimiento: { gte: hoy, lt: manana } }
      });
      if (yaExiste) continue;

      // Crear la tarea para HOY
      let nuevaFechaVenc = new Date(hoy);
      let nuevaHoraEjec: Date | null = null;

      if (plantilla.horaEjecucion) {
        nuevaHoraEjec = new Date(hoy);
        const horaOrig = new Date(plantilla.horaEjecucion);
        nuevaHoraEjec.setHours(horaOrig.getHours(), horaOrig.getMinutes(), 0, 0);
        nuevaFechaVenc = new Date(nuevaHoraEjec.getTime() + plantilla.tiempoEjecucionEstimadoSeg * 1000);
      }

      await prisma.tarea.create({
        data: {
          titulo: plantilla.titulo,
          descripcion: plantilla.descripcion,
          creadorId: plantilla.creadorId,
          asignadoId: plantilla.asignadoId,
          tiempoEjecucionEstimadoSeg: plantilla.tiempoEjecucionEstimadoSeg,
          generaPuntosYRecompensa: plantilla.generaPuntosYRecompensa,
          tipoRecurrencia: "Unica",
          fechaVencimiento: nuevaFechaVenc,
          horaEjecucion: nuevaHoraEjec,
          estado: "Pendiente",
          parentTaskId: plantilla.id,
          diaDelMes: plantilla.diaDelMes,
          isSurpriseEligible: plantilla.isSurpriseEligible,
          isChecklist: plantilla.isChecklist,
          generadaPorCron: true
        }
      });

      await prisma.tarea.update({
        where: { id: plantilla.id },
        data: { tipoRecurrencia: "Unica" }
      });

      generadasCount++;
    }

    console.log(`[Cron Daily] ${generadasCount} generadas`);

    // =====================
    // C) RECALCULAR %
    // =====================
    const usuarios = await prisma.usuario.findMany({ select: { id: true } });
    for (const usuario of usuarios) {
      await updateUserCompletionPercentage(usuario.id);
    }

    // =====================
    // D) PREMIOS
    // =====================
    const dayOfWeek = now.getDay() || 7;
    const dayOfMonth = now.getDate();
    const premios = await prisma.premio.findMany({ where: { activo: true } });
    let premiosEntregados = 0;

    for (const premio of premios) {
      let shouldRun = premio.tipoFrecuencia === "Semanal" && premio.diaEntregaSemana === dayOfWeek;
      if (!shouldRun && premio.tipoFrecuencia === "Mensual" && premio.diaDelMes === dayOfMonth) shouldRun = true;
      if (!shouldRun) continue;

      const tareasRequeridasIds = JSON.parse(premio.tareasRequeridasIds || "[]") as number[];

      for (const usuario of usuarios) {
        const yaTiene = await prisma.premioEntregado.findFirst({
          where: { premioId: premio.id, usuarioId: usuario.id, estado: { in: ["Pendiente", "Entregado"] } }
        });
        if (yaTiene) continue;

        let gano = tareasRequeridasIds.length === 0;
        if (!gano) {
          const completadas = await prisma.tarea.count({
            where: { id: { in: tareasRequeridasIds }, asignadoId: usuario.id, estado: { in: ["Completada", "Aprobada"] } }
          });
          gano = completadas === tareasRequeridasIds.length;
        }

        await prisma.premioEntregado.create({
          data: { premioId: premio.id, usuarioId: usuario.id, estado: gano ? "Pendiente" : "No_ganado" }
        });
        if (gano) premiosEntregados++;
      }
    }

    const elapsed = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      expiradas: expiradasCount,
      generadas: generadasCount,
      usuarios: usuarios.length,
      premios: premiosEntregados,
      elapsedMs: elapsed
    });

  } catch (error: any) {
    console.error("[Cron Daily] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}