import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { esDificultad } from "@/lib/recompensaTarea";
import { calcularPrimerVencimientoRecurrente } from "@/lib/recurrenceUtils";
import {
  formatearFechaLocalISO,
  normalizarRotacionConfig,
  primeraAsignacionRotativa,
  type RotacionConfig,
} from "@/lib/rotacionTarea";
import { getSession } from "@/lib/session";
import { limpiarFotoPruebaHuerfana } from "@/lib/tareas/fotoPruebaServidor";
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
    } else if (body.tipoRecurrencia && body.tipoRecurrencia !== "Unica") {
        const calculo = calcularPrimerVencimientoRecurrente(
          {
            tipoRecurrencia: body.tipoRecurrencia,
            diaDelMes: body.diaDelMes !== undefined ? (body.diaDelMes ? Number(body.diaDelMes) : null) : currentTask.diaDelMes,
            ordinalSemana: body.ordinalSemana !== undefined ? (body.ordinalSemana ? Number(body.ordinalSemana) : null) : currentTask.ordinalSemana,
            diaDeLaSemana: body.diaDeLaSemana !== undefined ? (body.diaDeLaSemana !== null ? Number(body.diaDeLaSemana) : null) : currentTask.diaDeLaSemana,
            intervalo: body.intervalo !== undefined ? Math.max(1, Math.min(365, Math.round(Number(body.intervalo)) || 1)) : currentTask.intervalo,
          },
          new Date(),
          body.hora
        );
        fechaVencimiento = calculo.fechaVencimiento;
        horaEjecucion = calculo.horaEjecucion;
    }

    const updatedData = {
        titulo: body.titulo,
        descripcion: body.descripcion !== undefined ? body.descripcion : currentTask.descripcion,
        tiempoEjecucionEstimadoSeg: body.tiempoMinutos ? parseInt(body.tiempoMinutos) * 60 : currentTask.tiempoEjecucionEstimadoSeg,
        fechaVencimiento,
        horaEjecucion,
        tipoRecurrencia: body.tipoRecurrencia,
        generaPuntosYRecompensa: body.generaRecompensa !== undefined ? Boolean(body.generaRecompensa) : currentTask.generaPuntosYRecompensa,
        dificultad: esDificultad(body.dificultad) ? body.dificultad : currentTask.dificultad,
        isSurpriseEligible: body.isSurpriseEligible !== undefined ? Boolean(body.isSurpriseEligible) : currentTask.isSurpriseEligible,
        requiereFotoPrueba: body.requiereFotoPrueba !== undefined ? Boolean(body.requiereFotoPrueba) : currentTask.requiereFotoPrueba,
        diaDelMes: body.diaDelMes !== undefined ? (body.diaDelMes ? Number(body.diaDelMes) : null) : currentTask.diaDelMes,
        ordinalSemana: body.ordinalSemana !== undefined ? (body.ordinalSemana ? Number(body.ordinalSemana) : null) : currentTask.ordinalSemana,
        diaDeLaSemana: body.diaDeLaSemana !== undefined ? (body.diaDeLaSemana !== null ? Number(body.diaDeLaSemana) : null) : currentTask.diaDeLaSemana,
        intervalo: body.intervalo !== undefined ? Math.max(1, Math.min(365, Math.round(Number(body.intervalo)) || 1)) : currentTask.intervalo,
        anclaCompletado: body.anclaCompletado !== undefined ? Boolean(body.anclaCompletado) && body.tipoRecurrencia !== "Unica" : currentTask.anclaCompletado,
    };

    const asignadoIds: number[] | null = Array.isArray(body.asignadoIds) && body.asignadoIds.length > 0
        ? [...new Set<number>(body.asignadoIds.map((v: any) => Number(v)))]
        : null;
    const checklistTextos: string[] | null = Array.isArray(body.checklistItems)
        ? body.checklistItems.map((t: any) => String(t).trim()).filter(Boolean)
        : null;
    const isChecklist = checklistTextos ? checklistTextos.length > 0 : currentTask.isChecklist;

    const rotacionInput =
      body.rotacionConfig !== undefined
        ? body.rotacionConfig
          ? normalizarRotacionConfig({
              ...body.rotacionConfig,
              responsablesIds:
                Array.isArray(body.rotacionConfig.responsablesIds) && body.rotacionConfig.responsablesIds.length > 0
                  ? body.rotacionConfig.responsablesIds
                  : asignadoIds ?? [currentTask.asignadoId],
            })
          : null
        : normalizarRotacionConfig((currentTask as any).rotacionConfig);

    let fotoDescartada: string | null = null;
    const updatedTask = await prisma.$transaction(async (tx) => {
        if (rotacionInput) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const anclaBase = currentTask.anclaFecha ?? currentTask.fechaVencimiento ?? hoy;
            const rotacionFinal: RotacionConfig = {
                ...rotacionInput,
                fechaInicio: rotacionInput.fechaInicio ?? formatearFechaLocalISO(anclaBase),
            };
            const tipoRecEfectivo =
                !updatedData.tipoRecurrencia || updatedData.tipoRecurrencia === "Unica"
                    ? "Diaria"
                    : updatedData.tipoRecurrencia;

            const proxima = primeraAsignacionRotativa(
                {
                    ...updatedData,
                    tipoRecurrencia: tipoRecEfectivo,
                    anclaFecha: anclaBase,
                    rotacionConfig: rotacionFinal,
                },
                hoy
            );

            const fechaAsignada = proxima ? new Date(proxima.fecha) : (updatedData.fechaVencimiento ?? hoy);
            fechaAsignada.setHours(0, 0, 0, 0);
            let horaAsignada = updatedData.horaEjecucion;
            if (body.hora) {
                const [h, m] = String(body.hora).split(":");
                horaAsignada = new Date(fechaAsignada);
                horaAsignada.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
            } else if (horaAsignada) {
                const orig = new Date(horaAsignada);
                horaAsignada = new Date(fechaAsignada);
                horaAsignada.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
            }

            // Si antes tenía copias simultáneas (grupoTareaId), limpiar las abiertas adicionales
            if (currentTask.grupoTareaId) {
                const otrasAbiertas = await tx.tarea.findMany({
                    where: {
                        grupoTareaId: currentTask.grupoTareaId,
                        id: { not: currentTask.id },
                        estado: { in: ["Pendiente", "En_progreso", "Pausada", "Vencida", "No_Realizada"] },
                    },
                    select: { id: true },
                });
                const idsBorrar = otrasAbiertas.map((o) => o.id);
                if (idsBorrar.length > 0) {
                    await tx.historialAccion.deleteMany({ where: { tareaId: { in: idsBorrar } } });
                    await tx.tarea.deleteMany({ where: { id: { in: idsBorrar } } });
                }
            }

            const esActiva = ["Pendiente", "En_progreso", "Pausada"].includes(currentTask.estado);
            const asignadoSiguiente = esActiva && proxima ? proxima.asignadoId : currentTask.asignadoId;
            const cambiaAsignado = asignadoSiguiente !== currentTask.asignadoId;
            if (cambiaAsignado) fotoDescartada = currentTask.fotoPruebaUrl;
            await tx.tarea.update({
                where: { id: currentTask.id },
                data: {
                    ...updatedData,
                    tipoRecurrencia: currentTask.generadaPorCron ? "Unica" : (tipoRecEfectivo as any),
                    fechaVencimiento: esActiva ? fechaAsignada : updatedData.fechaVencimiento,
                    horaEjecucion: esActiva ? horaAsignada : updatedData.horaEjecucion,
                    asignadoId: asignadoSiguiente,
                    anclaFecha: anclaBase,
                    grupoTareaId: null,
                    rotacionConfig: rotacionFinal as any,
                    isChecklist,
                    ...(cambiaAsignado ? { fotoPruebaUrl: null, fotoPruebaSubidaEn: null } : {}),
                } as any,
            });

            if (currentTask.parentTaskId) {
                await tx.tarea.updateMany({
                    where: { id: currentTask.parentTaskId },
                    data: {
                        titulo: updatedData.titulo,
                        descripcion: updatedData.descripcion,
                        tiempoEjecucionEstimadoSeg: updatedData.tiempoEjecucionEstimadoSeg,
                        dificultad: updatedData.dificultad,
                        tipoRecurrencia: tipoRecEfectivo as any,
                        rotacionConfig: rotacionFinal as any,
                        isChecklist,
                        isSurpriseEligible: updatedData.isSurpriseEligible,
                        requiereFotoPrueba: updatedData.requiereFotoPrueba,
                    } as any,
                });
            }

            if (checklistTextos) {
                const idsChecklist = [currentTask.id, ...(currentTask.parentTaskId ? [currentTask.parentTaskId] : [])];
                for (const tid of idsChecklist) {
                    const existentes = await tx.checklistItem.findMany({ where: { tareaId: tid } });
                    const hechos = new Set(existentes.filter((c) => c.completado).map((c) => c.texto));
                    await tx.checklistItem.deleteMany({ where: { tareaId: tid } });
                    if (checklistTextos.length > 0) {
                        await tx.checklistItem.createMany({
                            data: checklistTextos.map((texto, i) => ({
                                tareaId: tid,
                                texto,
                                orden: i + 1,
                                completado: hechos.has(texto),
                            })),
                        });
                    }
                }
            }

            return tx.tarea.findUnique({ where: { id: currentTask.id } });
        }

        // Filas de la misma tarea: una por persona, unidas por grupoTareaId
        const hermanas = currentTask.grupoTareaId
            ? await tx.tarea.findMany({ where: { grupoTareaId: currentTask.grupoTareaId } })
            : [currentTask];

        const limpiarRotacion = body.rotacionConfig === null ? { rotacionConfig: Prisma.DbNull } : {};

        if (currentTask.grupoTareaId) {
            await tx.tarea.updateMany({ where: { grupoTareaId: currentTask.grupoTareaId }, data: { ...updatedData, ...limpiarRotacion, isChecklist } as any });
        } else {
            const asignadoSiguiente = !asignadoIds && body.asignadoId ? parseInt(body.asignadoId) : currentTask.asignadoId;
            const cambiaAsignado = asignadoSiguiente !== currentTask.asignadoId;
            if (cambiaAsignado) fotoDescartada = currentTask.fotoPruebaUrl;
            await tx.tarea.update({
                where: { id: currentTask.id },
                data: {
                    ...updatedData,
                    ...limpiarRotacion,
                    isChecklist,
                    asignadoId: asignadoSiguiente,
                    ...(cambiaAsignado ? { fotoPruebaUrl: null, fotoPruebaSubidaEn: null } : {}),
                } as any,
            });
        }

        // Si es una instancia generada, la regla también conserva la exigencia de foto
        if (currentTask.parentTaskId) {
            await tx.tarea.update({
                where: { id: currentTask.parentTaskId },
                data: { requiereFotoPrueba: updatedData.requiereFotoPrueba },
            });
        }

        // El ancla se fija una vez: editar no la corre (solo la mueve completar)
        await tx.tarea.updateMany({
            where: { anclaFecha: null, ...(currentTask.grupoTareaId ? { grupoTareaId: currentTask.grupoTareaId } : { id: currentTask.id }) },
            data: { anclaFecha: currentTask.fechaVencimiento },
        });

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
                        intervalo: updatedData.intervalo,
                        anclaCompletado: updatedData.anclaCompletado,
                        anclaFecha: currentTask.anclaFecha ?? currentTask.fechaVencimiento,
                        isSurpriseEligible: updatedData.isSurpriseEligible,
                        isChecklist,
                        requiereFotoPrueba: updatedData.requiereFotoPrueba,
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

    // Si el cambio de responsable descartó la foto, liberamos el archivo si quedó huérfano
    if (fotoDescartada) {
      await limpiarFotoPruebaHuerfana(fotoDescartada).catch((error) => {
        console.error("No se pudo limpiar la foto de prueba descartada:", error);
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

    // HistorialAccion.tareaId no tiene cascade: sin borrar antes el historial, Postgres rechaza (FK) eliminar
    // cualquier tarea que ya se empezó, completó o revisó. Checklist cae por cascade y DiaLectivo/clones por SetNull.
    const fotosADescartar: string[] = [];
    await prisma.$transaction(async (tx) => {
      const filtro = grupoTareaId ? { grupoTareaId } : { id: parseInt(id) };
      const tareas = await tx.tarea.findMany({ where: filtro, select: { id: true, fotoPruebaUrl: true } });
      const ids = tareas.map((t) => t.id);
      if (ids.length === 0) return;
      for (const tarea of tareas) {
        if (tarea.fotoPruebaUrl) fotosADescartar.push(tarea.fotoPruebaUrl);
      }
      await tx.historialAccion.deleteMany({ where: { tareaId: { in: ids } } });
      await tx.tarea.deleteMany({ where: { id: { in: ids } } });
    });

    // Las fotos de prueba de las tareas eliminadas ya no se usan
    for (const url of fotosADescartar) {
      await limpiarFotoPruebaHuerfana(url).catch((error) => {
        console.error("No se pudo limpiar la foto de prueba de una tarea eliminada:", error);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE Task Error:", error);
    return NextResponse.json({ error: error instanceof Error ? `No se pudo eliminar la tarea: ${error.message.split("\n").pop()}` : "Error de servidor al eliminar la tarea" }, { status: 500 });
  }
}
