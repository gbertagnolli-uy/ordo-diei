import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listarCartasUsuario } from "@/lib/cartas/server";

export const dynamic = "force-dynamic";

// GET /api/cartas — Catálogo de cartas con progreso y contenido redactado para el usuario (D13)
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioId = Number(session.user.id);
    const resultado = await listarCartasUsuario(usuarioId);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("[API/Cartas] GET:", error);
    return NextResponse.json({ error: "Error al obtener las cartas" }, { status: 500 });
  }
}
