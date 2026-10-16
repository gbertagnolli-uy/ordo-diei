import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { quitarSuscripcion } from "@/lib/push/servidor";

export const dynamic = "force-dynamic";

// POST /api/push/desuscribir — { endpoint }: este dispositivo deja de recibir avisos
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    await quitarSuscripcion(Number(session.user.id), body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo desactivar" }, { status: 400 });
  }
}
