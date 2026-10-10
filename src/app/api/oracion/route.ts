import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fechaEditable, getEstadosOracion, guardarPlan } from "@/lib/oracion/server";
import { usuariosObjetivo } from "@/lib/oracion/permisos";

// GET /api/oracion?usuarioId=1&usuarioId=2 — estado del camino (propio, o de otros si es padre/madre)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const ids = await usuariosObjetivo(session, req.nextUrl.searchParams.getAll("usuarioId"));
    if (!ids) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    return NextResponse.json({ estados: await getEstadosOracion(ids) });
  } catch (error) {
    console.error("[API/Oracion] GET:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/oracion — comenzar el camino (inicio = hoy) o habilitar/quitar la mañana
// body: { usuarioIds?: number[], matutinumDesde?: "yyyy-MM-dd" | null }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = await usuariosObjetivo(session, body.usuarioIds);
    if (!ids) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { matutinumDesde } = body;
    if (matutinumDesde !== undefined && matutinumDesde !== null && !fechaEditable(matutinumDesde)) {
      return NextResponse.json({ error: "Fecha no válida" }, { status: 400 });
    }

    for (const id of ids) await guardarPlan(id, { matutinumDesde });
    return NextResponse.json({ estados: await getEstadosOracion(ids) });
  } catch (error) {
    console.error("[API/Oracion] POST:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
