// PUT { porcentaje, cfi?, pagina?, archivoId?, posicionSeg?, estado? } → { estado, porcentaje } (la posición propia) — lane 270
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { guardarPosicion } from "@/lib/biblioteca/servidor";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const actor = { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
  try {
    return NextResponse.json(await guardarPosicion(actor, Number(id), await req.json().catch(() => ({}))));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });
  }
}
