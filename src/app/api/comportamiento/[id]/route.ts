import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { eliminarComportamiento, listarComportamientos } from "@/lib/comportamiento/server";

export const dynamic = "force-dynamic";

// DELETE /api/comportamiento/[id] — borra el registro (y su premio si el niño todavía no lo abrió)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "ID no válido" }, { status: 400 });
    try {
      await eliminarComportamiento(session.user.rolFamiliar, id);
    } catch (err) {
      const status = (err as { status?: number }).status ?? 400;
      return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status });
    }
    return NextResponse.json(await listarComportamientos(session.user.rolFamiliar));
  } catch (err) {
    console.error("[API/Comportamiento] DELETE:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
