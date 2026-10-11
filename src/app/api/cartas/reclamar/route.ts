import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  reclamarFiesta,
  reclamarCumpleanos,
  reclamarBienvenida,
  reclamarGrado,
} from "@/lib/cartas/server";

export const dynamic = "force-dynamic";

// POST /api/cartas/reclamar — Reclamos idempotentes (vault/ECONOMIA_CARTAS.md):
// fiesta (la carta entera), cumple (carta elegida o Sobre gratis), bienvenida (3 Comunes) y grado alcanzado
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioId = Number(session.user.id);
    const body = await req.json().catch(() => ({}));
    const { tipo } = body;
    const cartaId = Number(body.cartaId);
    const cartaValida = Number.isInteger(cartaId) && cartaId > 0;

    if (tipo === "fiesta" || tipo === "grado") {
      if (!cartaValida) {
        return NextResponse.json({ error: "Se requiere un ID de carta válido" }, { status: 400 });
      }
      const resultado =
        tipo === "fiesta" ? await reclamarFiesta(usuarioId, cartaId) : await reclamarGrado(usuarioId, cartaId);
      return NextResponse.json(resultado);
    }

    if (tipo === "cumple") {
      const resultado = await reclamarCumpleanos(usuarioId, cartaValida ? cartaId : null);
      return NextResponse.json(resultado);
    }

    if (tipo === "bienvenida") {
      const resultado = await reclamarBienvenida(usuarioId);
      return NextResponse.json(resultado);
    }

    return NextResponse.json(
      { error: "Tipo de reclamo no válido. Debe ser 'fiesta', 'grado', 'cumple' o 'bienvenida'." },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("[API/Cartas/Reclamar] POST:", error);
    const mensaje = error instanceof Error ? error.message : "Error al procesar el reclamo";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
