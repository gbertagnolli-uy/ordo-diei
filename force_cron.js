const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function getNextDateByDayOfMonth(targetDay, fromDate = new Date()) {
  let year = fromDate.getFullYear();
  let month = fromDate.getMonth();
  if (fromDate.getDate() >= targetDay) {
    month++;
    if (month > 11) { month = 0; year++; }
  }
  const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();
  const finalDay = Math.min(targetDay, lastDayOfTargetMonth);
  return new Date(year, month, finalDay);
}

function getNextDateByNthWeekday(ordinal, targetDayOfWeek, fromDate = new Date()) {
  let year = fromDate.getFullYear();
  let month = fromDate.getMonth();
  const findInMonth = (y, m) => {
    if (ordinal === -1) {
      let date = new Date(y, m + 1, 0); 
      while (date.getDay() !== targetDayOfWeek) date.setDate(date.getDate() - 1);
      return date;
    } else {
      let date = new Date(y, m, 1);
      let count = 0;
      while (date.getMonth() === m) {
        if (date.getDay() === targetDayOfWeek) {
          count++;
          if (count === ordinal) return date;
        }
        date.setDate(date.getDate() + 1);
      }
      return null;
    }
  };
  let targetDate = findInMonth(year, month);
  if (!targetDate || targetDate <= fromDate) {
    month++;
    if (month > 11) { month = 0; year++; }
    targetDate = findInMonth(year, month);
  }
  return targetDate;
}

function calculateNextOccurrence(tarea, fromDate = new Date()) {
  const current = tarea.fechaVencimiento || fromDate;
  switch (tarea.tipoRecurrencia) {
    case "Diaria": {
      const next = new Date(current);
      next.setDate(next.getDate() + 1);
      return next;
    }
    case "Semanal": {
      const next = new Date(current);
      if (tarea.diaDeLaSemana !== undefined && tarea.diaDeLaSemana !== null) {
        next.setDate(next.getDate() + 1);
        while (next.getDay() !== tarea.diaDeLaSemana) {
          next.setDate(next.getDate() + 1);
        }
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    }
    case "Mensual_Fecha": {
      if (!tarea.diaDelMes) return null;
      return getNextDateByDayOfMonth(tarea.diaDelMes, current);
    }
    case "Mensual_Ordinal": {
      if (tarea.ordinalSemana == null || tarea.diaDeLaSemana == null) return null;
      return getNextDateByNthWeekday(tarea.ordinalSemana, tarea.diaDeLaSemana, current);
    }
    default:
      return null;
  }
}

async function runCronPass() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    await prisma.tarea.updateMany({
      where: {
        estado: { in: ["Pendiente", "En_progreso", "Pausada"] },
        fechaVencimiento: { lt: hoy }
      },
      data: {
        estado: "Vencida",
        retroalimentacionAlgoritmo: "Venció por inactividad. Puntos perdidos por negligencia."
      }
    });

    const recurrentes = await prisma.tarea.findMany({
      where: {
        tipoRecurrencia: { not: "Unica" },
        OR: [
          { estado: { in: ["Completada", "Aprobada", "Vencida", "Expirada"] } },
          { fechaVencimiento: { lt: hoy } }
        ]
      }
    });

    let count = 0;
    for (const t of recurrentes) {
       const nuevaFecha = calculateNextOccurrence({
         tipoRecurrencia: t.tipoRecurrencia,
         fechaVencimiento: t.fechaVencimiento,
         diaDelMes: t.diaDelMes,
         ordinalSemana: t.ordinalSemana,
         diaDeLaSemana: t.diaDeLaSemana,
       });

       if (!nuevaFecha) continue;

       let horaEjecucion = null;
       if (t.horaEjecucion) {
         const originalHora = new Date(t.horaEjecucion);
         horaEjecucion = new Date(nuevaFecha);
         horaEjecucion.setHours(originalHora.getHours(), originalHora.getMinutes(), 0, 0);
       }

       await prisma.tarea.create({
          data: {
             titulo: t.titulo,
             descripcion: t.descripcion,
             creadorId: t.creadorId,
             asignadoId: t.asignadoId,
             tiempoEjecucionEstimadoSeg: t.tiempoEjecucionEstimadoSeg,
             generaPuntosYRecompensa: t.generaPuntosYRecompensa,
             tipoRecurrencia: t.tipoRecurrencia,
             fechaVencimiento: nuevaFecha,
             horaEjecucion,
             estado: "Pendiente",
             parentTaskId: t.parentTaskId || t.id,
             grupoTareaId: t.grupoTareaId,
             isSurpriseEligible: t.isSurpriseEligible,
             isChecklist: t.isChecklist,
             diaDelMes: t.diaDelMes,
             ordinalSemana: t.ordinalSemana,
             diaDeLaSemana: t.diaDeLaSemana,
          }
       });
       count++;

       await prisma.tarea.update({
          where: { id: t.id },
          data: { tipoRecurrencia: "Unica" }
       });
    }

    return count;
}

async function main() {
    console.log("Iniciando cron run...");
    let totalClonadas = 0;
    while(true) {
        const count = await runCronPass();
        totalClonadas += count;
        console.log(`Clonadas en este pase: ${count}`);
        if(count === 0) break;
    }
    console.log(`Listo! Tareas clonadas totales: ${totalClonadas}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
