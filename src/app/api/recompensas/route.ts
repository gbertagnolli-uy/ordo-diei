import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getRecompensas } from "@/lib/recompensas/server";

export const dynamic = "force-dynamic";

// GET /api/recompensas — premios propios y, para padres, los reclamos por entregar
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    return NextResponse.json(await getRecompensas(Number(session.user.id), session.user.rolFamiliar));
  } catch (error) {
    console.error("[API/Recompensas] GET:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
