import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { comprarSobre, comprarFragmentosDirectos } from "@/lib/cartas/server";
import { TIPOS_SOBRE, type TipoSobre } from "@/lib/cartas/economia";

export const dynamic = "force-dynamic";

// POST /api/cartas/comprar — Compra atómica de sobres o fragmentos directos
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuarioId = Number(session.user.id);
    const body = await req.json().catch(() => ({}));
    const { tipo } = body;

    if (tipo === "sobre") {
      const { sobre } = body;
      if (!TIPOS_SOBRE.includes(sobre)) {
        return NextResponse.json(
          { error: `Tipo de sobre no válido. Debe ser uno de: ${TIPOS_SOBRE.join(", ")}.` },
          { status: 400 }
        );
      }

      const resultado = await comprarSobre(usuarioId, sobre as TipoSobre);
      return NextResponse.json(resultado);
    }

    if (tipo === "fragmentos") {
      const { cartaId, cantidad, moneda } = body;
      const numCartaId = Number(cartaId);
      const numCantidad = Number(cantidad);

      if (!numCartaId || isNaN(numCartaId)) {
        return NextResponse.json({ error: "ID de carta no válido" }, { status: 400 });
      }
      if (!numCantidad || isNaN(numCantidad) || numCantidad <= 0) {
        return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 });
      }
      if (moneda !== "puntos" && moneda !== "incienso" && moneda !== "estrellas") {
        return NextResponse.json(
          { error: "Moneda no válida. Debe ser 'puntos', 'incienso' o 'estrellas'." },
          { status: 400 }
        );
      }

      const resultado = await comprarFragmentosDirectos(
        usuarioId,
        numCartaId,
        numCantidad,
        moneda
      );
      return NextResponse.json(resultado);
    }

    return NextResponse.json(
      { error: "Tipo de compra no válido. Debe ser 'sobre' o 'fragmentos'." },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("[API/Cartas/Comprar] POST:", error);
    const mensaje = error instanceof Error ? error.message : "Error al procesar la compra";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
