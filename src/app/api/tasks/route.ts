import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { TipoRecurrencia } from "@prisma/client";
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
      generaRecompensa,
      esGlobal,      // Boolean: assign to all users
      isSurpriseEligible,
      isChecklist,
      checklistItems,
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
    } else if (tipoRecurrencia && tipoRecurrencia !== "Unica" && hora) {
      // Recurring task without explicit fecha — calculate dynamically
      // Business rule: if current time < hora límite → deadline = today
      //                if current time >= hora límite → deadline = tomorrow
      const now = new Date();
      const [h, m] = hora.split(":");
      const horaLimite = Number(h);
      const minLimite = Number(m);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (now.getHours() < horaLimite || (now.getHours() === horaLimite && now.getMinutes() < minLimite)) {
        fechaVencimiento = hoy; // today
      } else {
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        fechaVencimiento = manana; // tomorrow
      }

      // Build horaEjecucion with the calculated date
      const dtHora = new Date(fechaVencimiento);
      dtHora.setHours(horaLimite, minLimite, 0, 0);
      horaEjecucion = dtHora;
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

    // If multiple users, create a group ID to link co-responsable tasks
    const grupoTareaId = targetIds.length > 1 ? randomUUID() : null;

    const hasChecklist = Boolean(isChecklist) && Array.isArray(checklistItems) && checklistItems.length > 0;

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
            tipoRecurrencia: (tipoRecurrencia as any) || "Unica",
            diaDelMes: diaDelMes ? Number(diaDelMes) : null,
            ordinalSemana: ordinalSemana ? Number(ordinalSemana) : null,
            diaDeLaSemana: diaDeLaSemana !== undefined && diaDeLaSemana !== null ? Number(diaDeLaSemana) : null,
            fechaVencimiento,
            horaEjecucion,
            grupoTareaId,
            isSurpriseEligible: Boolean(isSurpriseEligible),
            isChecklist: hasChecklist,
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
