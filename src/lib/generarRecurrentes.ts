import type { PrismaClient } from "@prisma/client";
import { ocurreEn } from "./recurrenceUtils";

const ESTADOS_CERRADOS = ["Completada", "Aprobada", "Vencida", "Expirada", "No_Realizada"] as const;

/**
 * La tarea recurrente es una regla (plantilla) que genera instancias "Unica" con
 * parentTaskId. La regla conserva su tipoRecurrencia para siempre: solo se corta
 * si el usuario la edita o elimina, nunca por generar una instancia.
 * Idempotente: correrla dos veces el mismo día no duplica.
 */
export async function generarTareasRecurrentes(prisma: PrismaClient, hoy: Date): Promise<number> {
  const inicio = new Date(hoy);
  inicio.setHours(0, 0, 0, 0);
  const manana = new Date(inicio);
  manana.setDate(inicio.getDate() + 1);

  const reglas = await prisma.tarea.findMany({
    where: { tipoRecurrencia: { not: "Unica" }, generadaPorCron: false },
  });

  let generadas = 0;
  for (const regla of reglas) {
    if (!(ESTADOS_CERRADOS as readonly string[]).includes(regla.estado)) continue;
    if (!ocurreEn(regla, inicio)) continue;

    const yaExiste = await prisma.tarea.findFirst({
      where: {
        fechaVencimiento: { gte: inicio, lt: manana },
        estado: { notIn: ["Vencida", "Expirada", "No_Realizada"] },
        OR: [
          { id: regla.id },
          { parentTaskId: regla.id },
          { asignadoId: regla.asignadoId, titulo: { equals: regla.titulo, mode: "insensitive" } },
        ],
      },
    });
    if (yaExiste) continue;

    let fechaVenc = new Date(inicio);
    let horaEjec: Date | null = null;
    if (regla.horaEjecucion) {
      const orig = new Date(regla.horaEjecucion);
      horaEjec = new Date(inicio);
      horaEjec.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
      fechaVenc = new Date(horaEjec.getTime() + regla.tiempoEjecucionEstimadoSeg * 1000);
    }

    const nueva = await prisma.tarea.create({
      data: {
        titulo: regla.titulo,
        descripcion: regla.descripcion,
        creadorId: regla.creadorId,
        asignadoId: regla.asignadoId,
        tiempoEjecucionEstimadoSeg: regla.tiempoEjecucionEstimadoSeg,
        generaPuntosYRecompensa: regla.generaPuntosYRecompensa,
        tipoRecurrencia: "Unica",
        fechaVencimiento: fechaVenc,
        horaEjecucion: horaEjec,
        estado: "Pendiente",
        parentTaskId: regla.id,
        diaDelMes: regla.diaDelMes,
        ordinalSemana: regla.ordinalSemana,
        diaDeLaSemana: regla.diaDeLaSemana,
        isSurpriseEligible: regla.isSurpriseEligible,
        isChecklist: regla.isChecklist,
        generadaPorCron: true,
        grupoTareaId: regla.grupoTareaId,
      },
    });

    const items = await prisma.checklistItem.findMany({ where: { tareaId: regla.id }, orderBy: { orden: "asc" } });
    if (items.length > 0) {
      await prisma.checklistItem.createMany({ data: items.map(i => ({ tareaId: nueva.id, texto: i.texto, orden: i.orden })) });
    }
    generadas++;
  }
  return generadas;
}
