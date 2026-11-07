import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { puedeCambiarItem } from "@/lib/tareas/checklistCompartido";

// GET /api/tasks/[id]/checklist — Get all checklist items
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = Number(id);

    const [tarea, items] = await Promise.all([
      prisma.tarea.findUnique({ where: { id: taskId }, select: { grupoTareaId: true } }),
      prisma.checklistItem.findMany({
        where: { tareaId: taskId },
        orderBy: { orden: "asc" },
        include: { completadoPor: { select: { id: true, nombre: true, fotoUrl: true } } },
      }),
    ]);

    const total = items.length;
    const completados = items.filter(i => i.completado).length;
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

    return NextResponse.json({ items, total, completados, porcentaje, compartida: Boolean(tarea?.grupoTareaId) });
  } catch (error) {
    console.error("Checklist GET Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT /api/tasks/[id]/checklist — Add, update, or toggle checklist items
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = Number(id);
    const body = await req.json();
    const { action, itemId, texto, completado, items } = body;

    const task = await prisma.tarea.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

    if (action === "add") {
      // Add a single item
      const maxOrden = await prisma.checklistItem.findFirst({
        where: { tareaId: taskId },
        orderBy: { orden: "desc" },
        select: { orden: true }
      });
      const newOrden = (maxOrden?.orden || 0) + 1;

      await prisma.tarea.update({
        where: { id: taskId },
        data: { isChecklist: true }
      });

      const newItem = await prisma.checklistItem.create({
        data: {
          tareaId: taskId,
          texto: texto || "Nuevo item",
          orden: newOrden
        }
      });
      return NextResponse.json({ ok: true, item: newItem });
    }

    if (action === "toggle" && itemId) {
      const item = await prisma.checklistItem.findFirst({ where: { id: Number(itemId), tareaId: taskId } });
      if (!item) return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
      const pedido = completado !== undefined ? Boolean(completado) : !item.completado;
      const compartida = Boolean(task.grupoTareaId);
      const decision = puedeCambiarItem({ compartida, completadoActual: item.completado, completadoPedido: pedido });
      if (!decision.ok) return NextResponse.json({ error: decision.error }, { status: decision.status });

      if (!decision.sinCambios) {
        const autor = pedido ? { completadoPorId: Number(session.user.id), completadoEn: new Date() } : { completadoPorId: null, completadoEn: null };
        if (compartida && pedido) {
          // Global (lane 265): se marca en todas las copias del grupo; el primero que marca queda como autor
          const copias = await prisma.tarea.findMany({ where: { grupoTareaId: task.grupoTareaId }, select: { id: true } });
          await prisma.checklistItem.updateMany({
            where: { tareaId: { in: copias.map((c) => c.id) }, orden: item.orden, texto: item.texto, completado: false },
            data: { completado: true, ...autor },
          });
        } else {
          await prisma.checklistItem.update({ where: { id: item.id }, data: { completado: pedido, ...autor } });
        }
      }

      const allItems = await prisma.checklistItem.findMany({
        where: { tareaId: taskId },
        orderBy: { orden: "asc" },
        include: { completadoPor: { select: { id: true, nombre: true, fotoUrl: true } } },
      });
      const updated = allItems.find((i) => i.id === item.id);
      const allDone = allItems.length > 0 && allItems.every((i) => i.completado);
      return NextResponse.json({ ok: true, item: updated, items: allItems, allCompleted: allDone, total: allItems.length, completados: allItems.filter((i) => i.completado).length });
    }

    if (action === "delete" && itemId) {
      await prisma.checklistItem.delete({ where: { id: Number(itemId) } });
      return NextResponse.json({ ok: true });
    }

    if (action === "reorder" && items) {
      // Reorder items: items = [{ id, orden }]
      await prisma.$transaction(
        items.map((item: { id: number; orden: number }) =>
          prisma.checklistItem.update({
            where: { id: item.id },
            data: { orden: item.orden }
          })
        )
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "replaceAll" && items) {
      // Replace all checklist items (for form submission)
      await prisma.checklistItem.deleteMany({ where: { tareaId: taskId } });
      if (items.length > 0) {
        await prisma.tarea.update({
          where: { id: taskId },
          data: { isChecklist: true }
        });
        await prisma.$transaction(
          items.map((texto: string, index: number) =>
            prisma.checklistItem.create({
              data: { tareaId: taskId, texto, orden: index + 1 }
            })
          )
        );
      } else {
        await prisma.tarea.update({
          where: { id: taskId },
          data: { isChecklist: false }
        });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("Checklist PUT Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
