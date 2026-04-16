import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// PUT /api/tasks/[id]/timer — Start, pause, or get timer state
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = Number(id);
    const { action } = await req.json(); // "start" | "pause" | "get"

    const task = await prisma.tarea.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

    if (action === "start") {
      // Start the timer: record when it started
      await prisma.tarea.update({
        where: { id: taskId },
        data: { timerStartedAt: new Date() }
      });
      return NextResponse.json({ ok: true, timerStartedAt: new Date().toISOString(), tiempoAcumulado: task.tiempoAcumuladoTimer });
    }

    if (action === "pause") {
      // Pause: accumulate elapsed time since timerStartedAt
      let acumulado = task.tiempoAcumuladoTimer;
      if (task.timerStartedAt) {
        const elapsed = Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000);
        acumulado += elapsed;
      }
      await prisma.tarea.update({
        where: { id: taskId },
        data: { timerStartedAt: null, tiempoAcumuladoTimer: acumulado }
      });
      return NextResponse.json({ ok: true, tiempoAcumulado: acumulado });
    }

    // "get" — return current timer state
    return NextResponse.json({
      ok: true,
      timerStartedAt: task.timerStartedAt?.toISOString() || null,
      tiempoAcumulado: task.tiempoAcumuladoTimer
    });

  } catch (error) {
    console.error("Timer API Error:", error);
    return NextResponse.json({ error: "Error interno del timer" }, { status: 500 });
  }
}
