import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { reclamarFiesta, reclamarCumpleanos } from "@/lib/cartas/server";

export const dynamic = "force-dynamic";

// POST /api/cartas/reclamar — Reclamo idempotente de fiesta litúrgica (50%) o cumpleaños (100% o Sobre gratis)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioId = Number(session.user.id);
    const body = await req.json().catch(() => ({}));
    const { tipo } = body;

    if (tipo === "fiesta") {
      const cartaId = Number(body.cartaId);
      if (!cartaId || isNaN(cartaId)) {
        return NextResponse.json(
          { error: "Se requiere un ID de carta válido para reclamar el premio de festividad" },
          { status: 400 }
        );
      }

      const resultado = await reclamarFiesta(usuarioId, cartaId);
      return NextResponse.json(resultado);
    }

    if (tipo === "cumple") {
      const resultado = await reclamarCumpleanos(usuarioId);
      return NextResponse.json(resultado);
    }

    return NextResponse.json(
      { error: "Tipo de reclamo no válido. Debe ser 'fiesta' o 'cumple'." },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("[API/Cartas/Reclamar] POST:", error);
    const mensaje = error instanceof Error ? error.message : "Error al procesar el reclamo";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
