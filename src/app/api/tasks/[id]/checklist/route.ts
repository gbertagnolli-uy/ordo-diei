import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/tasks/[id]/checklist — Get all checklist items
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = Number(id);

    const items = await prisma.checklistItem.findMany({
      where: { tareaId: taskId },
      orderBy: { orden: "asc" }
    });

    const total = items.length;
    const completados = items.filter(i => i.completado).length;
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

    return NextResponse.json({ items, total, completados, porcentaje });
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
      // Toggle completion of an item
      const updated = await prisma.checklistItem.update({
        where: { id: Number(itemId) },
        data: { completado: completado !== undefined ? Boolean(completado) : undefined }
      });

      // Check if all items are completed (business rule: computed completion)
      const allItems = await prisma.checklistItem.findMany({ where: { tareaId: taskId } });
      const allDone = allItems.length > 0 && allItems.every(i => i.completado);

      return NextResponse.json({ ok: true, item: updated, allCompleted: allDone, total: allItems.length, completados: allItems.filter(i => i.completado).length });
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
