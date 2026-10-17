import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { guardarSuscripcion } from "@/lib/push/servidor";

export const dynamic = "force-dynamic";

// POST /api/push/suscribir — { subscription }: guarda este dispositivo para los avisos de la persona con sesión
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    await guardarSuscripcion(Number(session.user.id), body.subscription, req.headers.get("user-agent"));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo activar" }, { status: 400 });
  }
}
