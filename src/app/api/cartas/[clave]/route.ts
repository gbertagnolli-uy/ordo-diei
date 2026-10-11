import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { obtenerDetalleCarta } from "@/lib/cartas/server";

export const dynamic = "force-dynamic";

// GET /api/cartas/[clave] — Detalle de carta con contenido redactado según fragmentos (D13, D19)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clave: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { clave } = await params;
    if (!clave) {
      return NextResponse.json({ error: "Clave de carta no especificada" }, { status: 400 });
    }

    const usuarioId = Number(session.user.id);
    const esAdmin = session.user.rolFamiliar === "Padre" || session.user.rolFamiliar === "Madre";

    const carta = await obtenerDetalleCarta(usuarioId, clave, { esAdmin });
    if (!carta) {
      return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 });
    }

    return NextResponse.json(carta);
  } catch (error) {
    console.error("[API/Cartas/[clave]] GET:", error);
    return NextResponse.json({ error: "Error al obtener el detalle de la carta" }, { status: 500 });
  }
}
