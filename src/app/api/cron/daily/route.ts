import { generarTareasRecurrentes } from "@/lib/generarRecurrentes";
import prisma from "@/lib/prisma";
import { crearEntregaPremio } from "@/lib/recompensas/vales";
import { NextResponse } from "next/server";
import { updateUserCompletionPercentage } from "@/lib/userUtils";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { alumnosConPlanActivo, asegurarTareasDeHoy } from "@/lib/homeschooling/servidor/tareas";

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

    // B) GENERAR TAREAS PARA HOY (la regla recurrente se conserva)
    const generadasCount = await generarTareasRecurrentes(prisma, new Date());
    console.log(`[Cron Daily] ${generadasCount} generadas`);

    // B2) HOMESCHOOLING: Tarea de cada día lectivo de hoy (un alumno que falla no frena al resto)
    let hsCreadas = 0;
    for (const alumnoId of await alumnosConPlanActivo()) {
      try {
        hsCreadas += await asegurarTareasDeHoy(alumnoId, hoyEnFamilia());
      } catch (err) {
        console.error(`[Cron Daily] Homeschooling alumno ${alumnoId}:`, err);
      }
    }
    console.log(`[Cron Daily] ${hsCreadas} tareas de estudio`);

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

        await crearEntregaPremio(premio, usuario.id, gano);
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