// POST { cursor, limit } → { rows } (lane 271; protocolo de dovli). Solo las notas del usuario de la sesión.
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pullNotas } from "@/lib/notas/servidor/nube";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Iniciá sesión para sincronizar" }, { status: 401 });
  const { cursor = 0, limit = 100 } = await req.json().catch(() => ({}));
  return NextResponse.json({ rows: await pullNotas(Number(session.user.id), Number(cursor), Number(limit)) });
}
