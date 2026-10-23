import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { ocurreEn, tocaPorCompletado } from "./recurrenceUtils.ts";
import { normalizarRotacionConfig, ocurreRotacionEn, responsablesEnDia } from "./rotacionTarea.ts";

const ESTADOS_CERRADOS = ["Completada", "Aprobada", "Vencida", "Expirada", "No_Realizada"] as const;

/**
 * La tarea recurrente es una regla (plantilla) que genera instancias "Unica" con
 * parentTaskId. La regla conserva su tipoRecurrencia para siempre: solo se corta
 * si el usuario la edita o elimina, nunca por generar una instancia.
 * Si la regla tiene `rotacionConfig`, cada día que ocurre se asigna a los
 * responsables que corresponden en esa fecha (`responsablesEnDia`), admitiendo
 * múltiples responsables simultáneos para tareas en grupo.
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
    const rotacion = normalizarRotacionConfig((regla as any).rotacionConfig);

    if (rotacion) {
      // Cerrar turnos anteriores de esta rotación que hayan quedado sin completar en días pasados
      await prisma.tarea.updateMany({
        where: {
          OR: [{ id: regla.id }, { parentTaskId: regla.id }],
          fechaVencimiento: { lt: inicio },
          estado: { in: ["Pendiente", "En_progreso", "Pausada"] },
        },
        data: {
          estado: "No_Realizada",
          retroalimentacionAlgoritmo: "Turno finalizado sin entrega",
          timerStartedAt: null,
        },
      });

      if (!ocurreRotacionEn(regla as any, inicio)) continue;
      const asignadosHoy = responsablesEnDia(rotacion, inicio, regla.anclaFecha ?? regla.fechaVencimiento);
      if (asignadosHoy.length === 0) continue;

      const grupoCompartidoId = asignadosHoy.length > 1 ? (regla.grupoTareaId ?? randomUUID()) : regla.grupoTareaId;

      for (const asignadoHoy of asignadosHoy) {
        const yaExiste = await prisma.tarea.findFirst({
          where: {
            fechaVencimiento: { gte: inicio, lt: manana },
            asignadoId: asignadoHoy,
            estado: { notIn: ["Vencida", "Expirada", "No_Realizada"] },
            OR: [
              { id: regla.id },
              { parentTaskId: regla.id },
              { titulo: { equals: regla.titulo, mode: "insensitive" } },
            ],
          },
        });
        if (yaExiste) continue;

        const fechaVenc = new Date(inicio);
        let horaEjec: Date | null = null;
        if (regla.horaEjecucion) {
          const orig = new Date(regla.horaEjecucion);
          horaEjec = new Date(inicio);
          horaEjec.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
        }

        const nueva = await prisma.tarea.create({
          data: {
            titulo: regla.titulo,
            descripcion: regla.descripcion,
            creadorId: regla.creadorId,
            asignadoId: asignadoHoy,
            tiempoEjecucionEstimadoSeg: regla.tiempoEjecucionEstimadoSeg,
            generaPuntosYRecompensa: regla.generaPuntosYRecompensa,
            dificultad: regla.dificultad,
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
            requiereFotoPrueba: regla.requiereFotoPrueba,
            generadaPorCron: true,
            grupoTareaId: grupoCompartidoId,
            rotacionConfig: (regla as any).rotacionConfig ?? undefined,
          } as any,
        });

        const items = await prisma.checklistItem.findMany({ where: { tareaId: regla.id }, orderBy: { orden: "asc" } });
        if (items.length > 0) {
          await prisma.checklistItem.createMany({ data: items.map(i => ({ tareaId: nueva.id, texto: i.texto, orden: i.orden })) });
        }
        generadas++;
      }
      continue;
    }

    // Tareas recurrentes no rotativas
    if (!regla.anclaCompletado) {
      // Si no es cadena por completado, cerrar turnos de días pasados no completados
      await prisma.tarea.updateMany({
        where: {
          OR: [{ id: regla.id }, { parentTaskId: regla.id }],
          fechaVencimiento: { lt: inicio },
          estado: { in: ["Pendiente", "En_progreso", "Pausada"] },
        },
        data: {
          estado: "No_Realizada",
          retroalimentacionAlgoritmo: "Vencida sin entrega",
          timerStartedAt: null,
        },
      });
    }

    // Regla de generación para el día de hoy
    if (regla.anclaCompletado) {
      if (!(ESTADOS_CERRADOS as readonly string[]).includes(regla.estado)) continue;
      // Cadena: una sola abierta a la vez; la siguiente cuenta desde que se completó la última
      if (!tocaPorCompletado(regla, inicio)) continue;
      const abierta = await prisma.tarea.findFirst({
        where: { parentTaskId: regla.id, estado: { in: ["Pendiente", "En_progreso", "Esperando_Aprobacion"] } },
        select: { id: true },
      });
      if (abierta) continue;
    } else {
      if (!ocurreEn(regla, inicio)) continue;
    }

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
        dificultad: regla.dificultad,
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
        requiereFotoPrueba: regla.requiereFotoPrueba,
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

