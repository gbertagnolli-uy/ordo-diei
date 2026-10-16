import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { festejarEtapa, nombrarCompanero } from "@/lib/engagement/companeroServidor";

export const dynamic = "force-dynamic";

// POST /api/companero — { accion: "nombrar", nombre } o { accion: "festejar" }. Cada persona solo toca el suyo.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const usuarioId = Number(session.user.id);
    const body = await req.json().catch(() => ({}));
    if (body.accion === "nombrar") await nombrarCompanero(usuarioId, body.nombre);
    else if (body.accion === "festejar") await festejarEtapa(usuarioId);
    else return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar" }, { status: 400 });
  }
}
