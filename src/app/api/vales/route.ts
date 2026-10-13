import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listarVales } from "@/lib/recompensas/vales";

export const dynamic = "force-dynamic";

// GET /api/vales — todos los vales de la familia (solo padres)
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    return NextResponse.json({ vales: await listarVales(session.user.rolFamiliar) });
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status) return NextResponse.json({ error: (error as Error).message }, { status });
    console.error("[API/Vales] GET:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
