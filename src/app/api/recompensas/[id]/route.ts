import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { abrirPremioSorpresa } from "@/lib/comportamiento/server";
import { entregarRecompensa, getRecompensas, reclamarRecompensa } from "@/lib/recompensas/server";

export const dynamic = "force-dynamic";

// POST /api/recompensas/[id] — reclamar (dueño) o entregar (padre o madre)
// body: { accion: "reclamar", pedido? } | { accion: "abrir" } (sorpresa) | { accion: "entregar" }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const id = Number((await params).id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "ID no válido" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const usuarioId = Number(session.user.id);
    const rol = session.user.rolFamiliar;

    let apertura;
    try {
      if (body.accion === "abrir") apertura = await abrirPremioSorpresa(usuarioId, id);
      else if (body.accion === "reclamar") await reclamarRecompensa(usuarioId, id, body.pedido);
      else if (body.accion === "entregar") await entregarRecompensa({ id: usuarioId, rol }, id);
      else return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    } catch (err) {
      const status = (err as { status?: number }).status ?? 400;
      return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status });
    }

    return NextResponse.json({ ...(await getRecompensas(usuarioId, rol)), apertura });
  } catch (error) {
    console.error("[API/Recompensas] POST:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
