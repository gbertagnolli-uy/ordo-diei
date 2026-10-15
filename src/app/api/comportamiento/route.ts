import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listarComportamientos, registrarComportamiento } from "@/lib/comportamiento/server";

export const dynamic = "force-dynamic";

const fallo = (err: unknown) => {
  const status = (err as { status?: number }).status ?? 400;
  return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status });
};

// GET /api/comportamiento?usuarioId= — bitácora (solo padres)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const u = Number(req.nextUrl.searchParams.get("usuarioId"));
    return NextResponse.json(await listarComportamientos(session.user.rolFamiliar, Number.isInteger(u) && u > 0 ? u : undefined));
  } catch (err) {
    if ((err as { status?: number }).status) return fallo(err);
    console.error("[API/Comportamiento] GET:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/comportamiento — registrar un comportamiento (solo padres)
// body: { usuarioIds: number[] (o usuarioId), tipo: "Positivo"|"Negativo", titulo, evaluacion?, premios?: ItemPremio[], penitencia?, puntosPenalizados? }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    try {
      await registrarComportamiento({ id: Number(session.user.id), rol: session.user.rolFamiliar }, body);
    } catch (err) {
      return fallo(err);
    }
    return NextResponse.json(await listarComportamientos(session.user.rolFamiliar));
  } catch (err) {
    console.error("[API/Comportamiento] POST:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
