import { generarTareasRecurrentes } from "../src/lib/generarRecurrentes";
import prisma from "../src/lib/prisma";
import { updateUserCompletionPercentage } from "../src/lib/userUtils";

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

async function runCron() {
  const startTime = Date.now();
  const now = new Date();
  
  console.log("[Cron Daily] Iniciando...");

  // A) EXPIRAR TAREAS
  const tareasPendiente = await prisma.tarea.findMany({
    where: { estado: { in: ["Pendiente", "En_progreso"] } },
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
  console.log(`[Cron Daily] ${expiradasCount} tareas marcadas como No_Realizada`);

  // B) GENERAR TAREAS PARA HOY (la regla recurrente se conserva)
  const generadasCount = await generarTareasRecurrentes(prisma, new Date());
  console.log(`[Cron Daily] ${generadasCount} generadas`);

  // C) RECALCULAR %
  const usuarios = await prisma.usuario.findMany({ select: { id: true } });
  for (const usuario of usuarios) {
    await updateUserCompletionPercentage(usuario.id);
  }

  // D) PREMIOS
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
  console.log(`[Cron Daily] Completado en ${elapsed}ms`);
  console.log(`[Cron Daily] Resultado: ${expiradasCount} expiradas, ${generadasCount} generadas, ${premiosEntregados} premios`);

  await prisma.$disconnect();
}

runCron().catch(console.error);