import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { esDificultad } from "@/lib/recompensaTarea";
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
      return NextResponse.json({ error: "Permiso denegado. Solo administradores pueden editar en masa." }, { status: 403 });
    }

    const body = await req.json();
    const { action, ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Selecciona al menos una tarea" }, { status: 400 });
    }

    const numIds = ids.map((id: any) => Number(id)).filter((n) => Number.isFinite(n));
    if (numIds.length === 0) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    // Buscar las tareas seleccionadas y expandir grupos (grupoTareaId)
    const baseTasks = await prisma.tarea.findMany({
      where: { id: { in: numIds } },
    });
    if (baseTasks.length === 0) {
      return NextResponse.json({ error: "No se encontraron las tareas seleccionadas" }, { status: 404 });
    }

    const groupIds = [...new Set(baseTasks.map((t) => t.grupoTareaId).filter((g): g is string => Boolean(g)))];
    const allMatching = await prisma.tarea.findMany({
      where: {
        OR: [
          { id: { in: numIds } },
          ...(groupIds.length > 0 ? [{ grupoTareaId: { in: groupIds } }] : []),
        ],
      },
      orderBy: { id: "asc" },
    });
    const allIds = allMatching.map((t) => t.id);

    if (action === "delete") {
      await prisma.$transaction(async (tx) => {
        await tx.historialAccion.deleteMany({ where: { tareaId: { in: allIds } } });
        await tx.tarea.deleteMany({ where: { id: { in: allIds } } });
      });
      return NextResponse.json({ ok: true, count: allIds.length });
    }

    if (action === "difficulty") {
      if (!esDificultad(body.dificultad)) {
        return NextResponse.json({ error: "Dificultad inválida" }, { status: 400 });
      }
      await prisma.tarea.updateMany({
        where: { id: { in: allIds } },
        data: { dificultad: body.dificultad },
      });
      return NextResponse.json({ ok: true, count: allIds.length });
    }

    if (action === "reward") {
      const val = Boolean(body.generaRecompensa);
      await prisma.tarea.updateMany({
        where: { id: { in: allIds } },
        data: {
          generaPuntosYRecompensa: val,
          isSurpriseEligible: body.isSurpriseEligible !== undefined ? Boolean(body.isSurpriseEligible) : val,
        },
      });
      return NextResponse.json({ ok: true, count: allIds.length });
    }

    if (action === "dueDate") {
      if (!body.fecha || typeof body.fecha !== "string") {
        return NextResponse.json({ error: "Fecha límite inválida" }, { status: 400 });
      }
      const nuevaFecha = new Date(`${body.fecha}T00:00:00`);
      if (isNaN(nuevaFecha.getTime())) {
        return NextResponse.json({ error: "Fecha límite inválida" }, { status: 400 });
      }
      await prisma.$transaction(async (tx) => {
        for (const t of allMatching) {
          let nuevaHora: Date | null = t.horaEjecucion;
          if (t.horaEjecucion) {
            const d = new Date(nuevaFecha);
            d.setHours(t.horaEjecucion.getHours(), t.horaEjecucion.getMinutes(), 0, 0);
            nuevaHora = d;
          }
          await tx.tarea.update({
            where: { id: t.id },
            data: { fechaVencimiento: nuevaFecha, horaEjecucion: nuevaHora },
          });
        }
      });
      return NextResponse.json({ ok: true, count: allIds.length });
    }

    if (action === "dueTime") {
      if (!body.hora || typeof body.hora !== "string" || !/^\d{2}:\d{2}$/.test(body.hora)) {
        return NextResponse.json({ error: "Hora límite inválida" }, { status: 400 });
      }
      const [hStr, mStr] = body.hora.split(":");
      const h = Number(hStr);
      const m = Number(mStr);

      await prisma.$transaction(async (tx) => {
        for (const t of allMatching) {
          const base = t.fechaVencimiento ? new Date(t.fechaVencimiento) : new Date();
          base.setHours(0, 0, 0, 0);
          const nuevaHora = new Date(base);
          nuevaHora.setHours(h, m, 0, 0);
          await tx.tarea.update({
            where: { id: t.id },
            data: {
              fechaVencimiento: t.fechaVencimiento ?? base,
              horaEjecucion: nuevaHora,
            },
          });
        }
      });
      return NextResponse.json({ ok: true, count: allIds.length });
    }

    if (action === "assignees") {
      const asignadoIds: number[] = Array.isArray(body.asignadoIds)
        ? [...new Set<number>(body.asignadoIds.map((v: any) => Number(v)).filter((n: number) => Number.isFinite(n)))]
        : [];
      if (asignadoIds.length === 0) {
        return NextResponse.json({ error: "Selecciona al menos una persona" }, { status: 400 });
      }

      // Agrupamos por grupoTareaId (o tarea individual si no tiene grupo)
      const unidades = new Map<string, typeof allMatching>();
      for (const t of allMatching) {
        const key = t.grupoTareaId ? `g:${t.grupoTareaId}` : `t:${t.id}`;
        const list = unidades.get(key) ?? [];
        list.push(t);
        unidades.set(key, list);
      }

      await prisma.$transaction(async (tx) => {
        for (const [, hermanas] of unidades) {
          const repr = hermanas[0];
          if (!repr.grupoTareaId && asignadoIds.length === 1) {
            await tx.tarea.update({
              where: { id: repr.id },
              data: { asignadoId: asignadoIds[0] },
            });
            continue;
          }

          const actuales = new Set(hermanas.map((h) => h.asignadoId));
          const agregar = asignadoIds.filter((uid) => !actuales.has(uid));
          const quitar = [...actuales].filter((uid) => !asignadoIds.includes(uid));
          const grupoTareaId = repr.grupoTareaId ?? (asignadoIds.length > 1 ? randomUUID() : null);

          if (!repr.grupoTareaId && grupoTareaId) {
            await tx.tarea.update({ where: { id: repr.id }, data: { grupoTareaId } });
          }

          for (const uid of quitar) {
            const filas = hermanas.filter((h) => h.asignadoId === uid);
            const idsQuitar = filas.map((f) => f.id);
            await tx.historialAccion.deleteMany({
              where: { tareaId: { in: idsQuitar }, tarea: { estado: { in: ["Pendiente", "En_progreso", "Vencida", "No_Realizada"] } } },
            });
            await tx.tarea.deleteMany({
              where: { id: { in: idsQuitar }, estado: { in: ["Pendiente", "En_progreso", "Vencida", "No_Realizada"] } },
            });
            if (repr.grupoTareaId) {
              await tx.tarea.updateMany({
                where: { asignadoId: uid, grupoTareaId: repr.grupoTareaId },
                data: { grupoTareaId: null },
              });
            }
          }

          const textos = (
            await tx.checklistItem.findMany({ where: { tareaId: repr.id }, orderBy: { orden: "asc" } })
          ).map((c) => c.texto);

          for (const uid of agregar) {
            const copia = await tx.tarea.create({
              data: {
                titulo: repr.titulo,
                descripcion: repr.descripcion,
                creadorId: user.id,
                asignadoId: uid,
                tiempoEjecucionEstimadoSeg: repr.tiempoEjecucionEstimadoSeg,
                generaPuntosYRecompensa: repr.generaPuntosYRecompensa,
                dificultad: repr.dificultad,
                tipoRecurrencia: repr.tipoRecurrencia,
                fechaVencimiento: repr.fechaVencimiento,
                horaEjecucion: repr.horaEjecucion,
                diaDelMes: repr.diaDelMes,
                ordinalSemana: repr.ordinalSemana,
                diaDeLaSemana: repr.diaDeLaSemana,
                intervalo: repr.intervalo,
                anclaCompletado: repr.anclaCompletado,
                anclaFecha: repr.anclaFecha ?? repr.fechaVencimiento,
                isSurpriseEligible: repr.isSurpriseEligible,
                isChecklist: repr.isChecklist,
                grupoTareaId,
              },
            });
            if (textos.length > 0) {
              await tx.checklistItem.createMany({
                data: textos.map((texto, i) => ({ tareaId: copia.id, texto, orden: i + 1 })),
              });
            }
          }
        }
      });

      return NextResponse.json({ ok: true, count: unidades.size });
    }

    return NextResponse.json({ error: "Acción en masa desconocida" }, { status: 400 });
  } catch (error) {
    console.error("Bulk Task Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al aplicar la acción en masa" },
      { status: 500 }
    );
  }
}
