import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fijarMetaSemanal, metaDeLaSemana } from "@/lib/engagement/metaServidor";

export const dynamic = "force-dynamic";

// GET /api/meta-semanal — la meta de esta semana y su avance
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await metaDeLaSemana({ id: Number(session.user.id), rol: session.user.rolFamiliar }));
}

// POST /api/meta-semanal — { objetivo, premio }: un padre o madre fija la meta de esta semana
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    await fijarMetaSemanal({ id: Number(session.user.id), rol: session.user.rolFamiliar }, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo fijar la meta" }, { status });
  }
}
