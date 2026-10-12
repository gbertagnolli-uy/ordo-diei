import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DIFICULTAD_DEFAULT, esDificultad } from "@/lib/recompensaTarea";
import { getSession } from "@/lib/session";
import { randomUUID } from "crypto";

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
        dificultad: esDificultad(body.dificultad) ? body.dificultad : currentTask.dificultad,
        isSurpriseEligible: body.isSurpriseEligible !== undefined ? Boolean(body.isSurpriseEligible) : currentTask.isSurpriseEligible,
        diaDelMes: body.diaDelMes !== undefined ? (body.diaDelMes ? Number(body.diaDelMes) : null) : currentTask.diaDelMes,
        ordinalSemana: body.ordinalSemana !== undefined ? (body.ordinalSemana ? Number(body.ordinalSemana) : null) : currentTask.ordinalSemana,
        diaDeLaSemana: body.diaDeLaSemana !== undefined ? (body.diaDeLaSemana !== null ? Number(body.diaDeLaSemana) : null) : currentTask.diaDeLaSemana,
    };

    const asignadoIds: number[] | null = Array.isArray(body.asignadoIds) && body.asignadoIds.length > 0
        ? [...new Set<number>(body.asignadoIds.map((v: any) => Number(v)))]
        : null;
    const checklistTextos: string[] | null = Array.isArray(body.checklistItems)
        ? body.checklistItems.map((t: any) => String(t).trim()).filter(Boolean)
        : null;
    const isChecklist = checklistTextos ? checklistTextos.length > 0 : currentTask.isChecklist;

    const updatedTask = await prisma.$transaction(async (tx) => {
        // Filas de la misma tarea: una por persona, unidas por grupoTareaId
        const hermanas = currentTask.grupoTareaId
            ? await tx.tarea.findMany({ where: { grupoTareaId: currentTask.grupoTareaId } })
            : [currentTask];

        if (currentTask.grupoTareaId) {
            await tx.tarea.updateMany({ where: { grupoTareaId: currentTask.grupoTareaId }, data: { ...updatedData, isChecklist } });
        } else {
            await tx.tarea.update({
                where: { id: currentTask.id },
                data: {
                    ...updatedData,
                    isChecklist,
                    asignadoId: !asignadoIds && body.asignadoId ? parseInt(body.asignadoId) : currentTask.asignadoId,
                },
            });
        }

        if (asignadoIds) {
            const actuales = new Set(hermanas.map(h => h.asignadoId));
            const agregar = asignadoIds.filter(uid => !actuales.has(uid));
            const quitar = [...actuales].filter(uid => !asignadoIds.includes(uid));
            const grupoTareaId = currentTask.grupoTareaId ?? (asignadoIds.length > 1 ? randomUUID() : null);

            if (!currentTask.grupoTareaId && grupoTareaId) {
                await tx.tarea.update({ where: { id: currentTask.id }, data: { grupoTareaId } });
            }

            // Quitar personas: se borran sus filas abiertas y el historial queda suelto
            for (const uid of quitar) {
                const filas = hermanas.filter(h => h.asignadoId === uid);
                await tx.tarea.deleteMany({
                    where: { id: { in: filas.map(f => f.id) }, estado: { in: ["Pendiente", "En_progreso", "Vencida", "No_Realizada"] } },
                });
                await tx.tarea.updateMany({ where: { asignadoId: uid, grupoTareaId: currentTask.grupoTareaId }, data: { grupoTareaId: null } });
            }

            // Agregar personas: copia de esta tarea, abierta y con el mismo checklist
            for (const uid of agregar) {
                const copia = await tx.tarea.create({
                    data: {
                        titulo: updatedData.titulo,
                        descripcion: updatedData.descripcion,
                        creadorId: user.id,
                        asignadoId: uid,
                        tiempoEjecucionEstimadoSeg: updatedData.tiempoEjecucionEstimadoSeg,
                        generaPuntosYRecompensa: true,
                        dificultad: updatedData.dificultad,
                        tipoRecurrencia: updatedData.tipoRecurrencia,
                        fechaVencimiento: updatedData.fechaVencimiento,
                        horaEjecucion: updatedData.horaEjecucion,
                        diaDelMes: updatedData.diaDelMes,
                        ordinalSemana: updatedData.ordinalSemana,
                        diaDeLaSemana: updatedData.diaDeLaSemana,
                        isSurpriseEligible: updatedData.isSurpriseEligible,
                        isChecklist,
                        grupoTareaId,
                    },
                });
                const textos = checklistTextos
                    ?? (await tx.checklistItem.findMany({ where: { tareaId: currentTask.id }, orderBy: { orden: "asc" } })).map(c => c.texto);
                if (textos.length > 0) {
                    await tx.checklistItem.createMany({ data: textos.map((texto, i) => ({ tareaId: copia.id, texto, orden: i + 1 })) });
                }
            }
        }

        // Checklist: se reescribe en las filas abiertas, conservando lo ya tildado
        if (checklistTextos) {
            const abiertas = await tx.tarea.findMany({
                where: {
                    ...(currentTask.grupoTareaId ? { grupoTareaId: currentTask.grupoTareaId } : { id: currentTask.id }),
                    estado: { in: ["Pendiente", "En_progreso"] },
                },
                include: { checklistItems: true },
            });
            for (const fila of abiertas) {
                const mismos = fila.checklistItems.length === checklistTextos.length
                    && fila.checklistItems.every((c, i) => c.texto === checklistTextos[i]);
                if (mismos) continue;
                const hechos = new Set(fila.checklistItems.filter(c => c.completado).map(c => c.texto));
                await tx.checklistItem.deleteMany({ where: { tareaId: fila.id } });
                if (checklistTextos.length > 0) {
                    await tx.checklistItem.createMany({
                        data: checklistTextos.map((texto, i) => ({ tareaId: fila.id, texto, orden: i + 1, completado: hechos.has(texto) })),
                    });
                }
            }
        }

        return tx.tarea.findUnique({ where: { id: currentTask.id } });
    });

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
