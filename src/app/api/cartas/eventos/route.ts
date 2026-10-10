import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { eventosDeHoy } from "@/lib/cartas/server";

export const dynamic = "force-dynamic";

// GET /api/cartas/eventos — Consulta los eventos de fiesta litúrgica y cumpleaños para hoy
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioId = Number(session.user.id);
    const eventos = await eventosDeHoy(usuarioId);

    return NextResponse.json(eventos);
  } catch (error) {
    console.error("[API/Cartas/Eventos] GET:", error);
    return NextResponse.json({ error: "Error al consultar los eventos del día" }, { status: 500 });
  }
}
