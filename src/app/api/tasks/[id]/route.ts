import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { user } = session;
    const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";
    
    if (!isParent) {
      return NextResponse.json({ error: "Permiso denegado. Solo administradores pueden editar." }, { status: 403 });
    }

    const { id } = await props.params;
    const body = await req.json();

    const currentTask = await prisma.tarea.findUnique({ where: { id: parseInt(id) } });
    if (!currentTask) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    let fechaVencimiento = currentTask.fechaVencimiento;
    let horaEjecucion = currentTask.horaEjecucion;

    if (body.fecha && body.fecha !== "" && body.fecha !== "null" && body.tipoRecurrencia === 'Unica') {
        fechaVencimiento = new Date(`${body.fecha}T00:00:00`);
        if (body.hora) {
          horaEjecucion = new Date(`${body.fecha}T${body.hora}:00`);
        }
    } else if (body.tipoRecurrencia && body.tipoRecurrencia !== "Unica" && body.hora) {
        // Dynamic deadline recalculation for recurring tasks
        const now = new Date();
        const [h, m] = body.hora.split(":");
        const horaLimite = Number(h);
        const minLimite = Number(m);
  
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
  
        if (now.getHours() < horaLimite || (now.getHours() === horaLimite && now.getMinutes() < minLimite)) {
          fechaVencimiento = hoy;
        } else {
          const manana = new Date(hoy);
          manana.setDate(manana.getDate() + 1);
          fechaVencimiento = manana;
        }
  
        const dtHora = new Date(fechaVencimiento);
        dtHora.setHours(horaLimite, minLimite, 0, 0);
        horaEjecucion = dtHora;
    }

    const updatedData = {
        titulo: body.titulo,
        descripcion: body.descripcion !== undefined ? body.descripcion : currentTask.descripcion,
        tiempoEjecucionEstimadoSeg: body.tiempoMinutos ? parseInt(body.tiempoMinutos) * 60 : currentTask.tiempoEjecucionEstimadoSeg,
        fechaVencimiento,
        horaEjecucion,
        tipoRecurrencia: body.tipoRecurrencia,
        generaPuntosYRecompensa: true, // Points are ALWAYS generated
        isSurpriseEligible: body.isSurpriseEligible !== undefined ? Boolean(body.isSurpriseEligible) : currentTask.isSurpriseEligible,
        diaDelMes: body.diaDelMes !== undefined ? (body.diaDelMes ? Number(body.diaDelMes) : null) : currentTask.diaDelMes,
        ordinalSemana: body.ordinalSemana !== undefined ? (body.ordinalSemana ? Number(body.ordinalSemana) : null) : currentTask.ordinalSemana,
        diaDeLaSemana: body.diaDeLaSemana !== undefined ? (body.diaDeLaSemana !== null ? Number(body.diaDeLaSemana) : null) : currentTask.diaDeLaSemana,
    };

    let updatedTask;

    if (currentTask.grupoTareaId) {
        // Update all tasks in the group (atomicity)
        await prisma.tarea.updateMany({
            where: { grupoTareaId: currentTask.grupoTareaId },
            data: updatedData
        });
        // Refetch to return the updated record
        updatedTask = await prisma.tarea.findUnique({ where: { id: parseInt(id) } });
    } else {
        // Update single task (and optionally change its assignee if provided)
        updatedTask = await prisma.tarea.update({
            where: { id: parseInt(id) },
            data: {
                ...updatedData,
                asignadoId: body.asignadoId ? parseInt(body.asignadoId) : currentTask.asignadoId,
            }
        });
    }

    return NextResponse.json({ ok: true, task: updatedTask });
  } catch (error) {
    console.error("PUT Task Error:", error);
    return NextResponse.json({ error: "Error de servidor al guardar la edición de la tarea" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const isParent = session.user.rolFamiliar === "Padre" || session.user.rolFamiliar === "Madre";
    if (!isParent) {
      return NextResponse.json({ error: "Permiso denegado. Solo administradores pueden eliminar." }, { status: 403 });
    }

    const { id } = await props.params;
    const searchParams = req.nextUrl.searchParams;
    const grupoTareaId = searchParams.get("grupoTareaId");

    if (grupoTareaId) {
      await prisma.tarea.deleteMany({
        where: { grupoTareaId: grupoTareaId }
      });
    } else {
      await prisma.tarea.delete({
        where: { id: parseInt(id) }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE Task Error:", error);
    return NextResponse.json({ error: "Error de servidor al eliminar la tarea" }, { status: 500 });
  }
}
