import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DIFICULTAD_DEFAULT, esDificultad } from "@/lib/recompensaTarea";
import { calcularPrimerVencimientoRecurrente } from "@/lib/recurrenceUtils";
import {
  formatearFechaLocalISO,
  normalizarRotacionConfig,
  primerasAsignacionesRotativas,
  primeraAsignacionRotativa,
  type RotacionConfig,
} from "@/lib/rotacionTarea";
import { getSession } from "@/lib/session";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { user } = session;
    const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";
    if (!isParent) {
      return NextResponse.json({ error: "Solo los administradores pueden crear tareas" }, { status: 403 });
    }

    const body = await req.json();
    const {
      titulo,
      descripcion,
      asignadoIds,   // Array of user IDs (new)
      asignadoId,    // Single user ID (legacy fallback)
      tiempoMinutos,
      fecha,
      hora,
      tipoRecurrencia,
      diaDelMes,
      ordinalSemana,
      diaDeLaSemana,
      intervalo,
      anclaCompletado,
      generaRecompensa,
      esGlobal,      // Boolean: assign to all users
      isSurpriseEligible,
      isChecklist,
      checklistItems,
      requiereFotoPrueba,
      dificultad,
      rotacionConfig: rawRotacionConfig,
    } = body;

    const tiempoEjecucionEstimadoSeg = Number(tiempoMinutos) * 60;

    let fechaVencimiento: Date | null = null;
    let horaEjecucion: Date | null = null;

    if (fecha && fecha !== "" && fecha !== "null") {
      // Explicit date provided (Unica or other types with manual date)
      fechaVencimiento = new Date(fecha + "T00:00:00");
      if (hora) {
        const [h, m] = hora.split(":");
        const dt = new Date(fecha + "T00:00:00");
        dt.setHours(Number(h), Number(m), 0, 0);
        horaEjecucion = dt;
      }
    } else if (tipoRecurrencia && tipoRecurrencia !== "Unica") {
      const calculo = calcularPrimerVencimientoRecurrente(
        {
          tipoRecurrencia,
          diaDelMes: diaDelMes ? Number(diaDelMes) : null,
          ordinalSemana: ordinalSemana ? Number(ordinalSemana) : null,
          diaDeLaSemana: diaDeLaSemana !== undefined && diaDeLaSemana !== null ? Number(diaDeLaSemana) : null,
          intervalo: Math.max(1, Math.min(365, Math.round(Number(intervalo)) || 1)),
        },
        new Date(),
        hora
      );
      fechaVencimiento = calculo.fechaVencimiento;
      horaEjecucion = calculo.horaEjecucion;
    }

    // Determine target user IDs
    let targetIds: number[] = [];

    if (esGlobal) {
      const allUsers = await prisma.usuario.findMany({ select: { id: true } });
      targetIds = allUsers.map(u => u.id);
    } else if (asignadoIds && Array.isArray(asignadoIds) && asignadoIds.length > 0) {
      targetIds = asignadoIds.map((id: any) => Number(id));
    } else if (asignadoId) {
      targetIds = [Number(asignadoId)];
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "Debes seleccionar al menos un usuario" }, { status: 400 });
    }

    const hasChecklist = Boolean(isChecklist) && Array.isArray(checklistItems) && checklistItems.length > 0;
    const intervaloLimpio = Math.max(1, Math.min(365, Math.round(Number(intervalo)) || 1));

    // Verificar si es una tarea compartida con rotación de responsable
    const rotacionInput = rawRotacionConfig
      ? normalizarRotacionConfig({
          ...rawRotacionConfig,
          responsablesIds:
            Array.isArray(rawRotacionConfig.responsablesIds) && rawRotacionConfig.responsablesIds.length > 0
              ? rawRotacionConfig.responsablesIds
              : targetIds,
        })
      : null;

    if (rotacionInput) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaBase =
        fecha && fecha !== "" && fecha !== "null" ? new Date(fecha + "T00:00:00") : hoy;

      const rotacionFinal: RotacionConfig = {
        ...rotacionInput,
        fechaInicio: rotacionInput.fechaInicio ?? formatearFechaLocalISO(fechaBase),
      };

      const tipoRecEfectivo =
        !tipoRecurrencia || tipoRecurrencia === "Unica" ? "Diaria" : tipoRecurrencia;

      const primera = primerasAsignacionesRotativas(
        {
          tipoRecurrencia: tipoRecEfectivo,
          fechaVencimiento: fechaBase,
          diaDelMes: diaDelMes ? Number(diaDelMes) : null,
          ordinalSemana: ordinalSemana ? Number(ordinalSemana) : null,
          diaDeLaSemana: diaDeLaSemana !== undefined && diaDeLaSemana !== null ? Number(diaDeLaSemana) : null,
          intervalo: intervaloLimpio,
          anclaFecha: fechaBase,
          rotacionConfig: rotacionFinal,
        },
        fechaBase
      );

      if (!primera || primera.asignadosIds.length === 0) {
        return NextResponse.json(
          { error: "Debes asignar al menos un día o responsable válido para la rotación" },
          { status: 400 }
        );
      }

      const fechaPrimera = new Date(primera.fecha);
      fechaPrimera.setHours(0, 0, 0, 0);
      let horaPrimera: Date | null = null;
      if (hora) {
        const [h, m] = String(hora).split(":");
        horaPrimera = new Date(fechaPrimera);
        horaPrimera.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
      }

      const grupoRotacionId = primera.asignadosIds.length > 1 ? randomUUID() : null;

      const createdTasks = await prisma.$transaction(async (tx) => {
        const tasks = [];
        for (const uid of primera.asignadosIds) {
          const task = await tx.tarea.create({
            data: {
              titulo,
              descripcion,
              creadorId: user.id,
              asignadoId: uid,
              tiempoEjecucionEstimadoSeg,
              generaPuntosYRecompensa: Boolean(generaRecompensa),
              dificultad: esDificultad(dificultad) ? dificultad : DIFICULTAD_DEFAULT,
              tipoRecurrencia: tipoRecEfectivo as any,
              diaDelMes: diaDelMes ? Number(diaDelMes) : null,
              ordinalSemana: ordinalSemana ? Number(ordinalSemana) : null,
              diaDeLaSemana: diaDeLaSemana !== undefined && diaDeLaSemana !== null ? Number(diaDeLaSemana) : null,
              intervalo: intervaloLimpio,
              anclaCompletado: Boolean(anclaCompletado),
              anclaFecha: fechaBase,
              fechaVencimiento: fechaPrimera,
              horaEjecucion: horaPrimera,
              grupoTareaId: grupoRotacionId,
              rotacionConfig: rotacionFinal as any,
              isSurpriseEligible: Boolean(isSurpriseEligible),
              isChecklist: hasChecklist,
              requiereFotoPrueba: Boolean(requiereFotoPrueba),
            } as any,
          });

          if (hasChecklist) {
            await tx.checklistItem.createMany({
              data: checklistItems.map((texto: string, index: number) => ({
                tareaId: task.id,
                texto,
                orden: index + 1,
              })),
            });
          }
          tasks.push(task);
        }

        return tasks;
      });

      return NextResponse.json(createdTasks, { status: 201 });
    }

    // If multiple users without rotation, create a group ID to link simultaneous co-responsable tasks
    const grupoTareaId = targetIds.length > 1 ? randomUUID() : null;

    const createdTasks = await prisma.$transaction(async (tx) => {
      const tasks = [];
      for (const uid of targetIds) {
        const task = await tx.tarea.create({
          data: {
            titulo,
            descripcion,
            creadorId: user.id,
            asignadoId: uid,
            tiempoEjecucionEstimadoSeg,
            generaPuntosYRecompensa: Boolean(generaRecompensa),
            dificultad: esDificultad(dificultad) ? dificultad : DIFICULTAD_DEFAULT,
            tipoRecurrencia: (tipoRecurrencia as any) || "Unica",
            diaDelMes: diaDelMes ? Number(diaDelMes) : null,
            ordinalSemana: ordinalSemana ? Number(ordinalSemana) : null,
            diaDeLaSemana: diaDeLaSemana !== undefined && diaDeLaSemana !== null ? Number(diaDeLaSemana) : null,
            intervalo: intervaloLimpio,
            anclaCompletado: Boolean(anclaCompletado) && tipoRecurrencia !== "Unica",
            anclaFecha: fechaVencimiento,
            fechaVencimiento,
            horaEjecucion,
            grupoTareaId,
            isSurpriseEligible: Boolean(isSurpriseEligible),
            isChecklist: hasChecklist,
            requiereFotoPrueba: Boolean(requiereFotoPrueba),
          }
        });

        // Create checklist items if provided
        if (hasChecklist) {
          await tx.checklistItem.createMany({
            data: checklistItems.map((texto: string, index: number) => ({
              tareaId: task.id,
              texto,
              orden: index + 1,
            }))
          });
        }

        tasks.push(task);
      }
      return tasks;
    });

    return NextResponse.json(createdTasks, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Error interno creando la tarea" }, { status: 500 });
  }
}

