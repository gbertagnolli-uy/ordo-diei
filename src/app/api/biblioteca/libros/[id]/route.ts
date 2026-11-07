// GET → { libro } (con archivos y la posición de quien pregunta) · PATCH / DELETE (padres) — lane 270
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { borrarLibro, detalleLibro, editarLibro } from "@/lib/biblioteca/servidor";

export const dynamic = "force-dynamic";

const fallo = (e: unknown) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });

async function contexto(params: Promise<{ id: string }>) {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const { id } = await params;
  return { actor: { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) }, id: Number(id) };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await contexto(params);
  if (!c) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ libro: await detalleLibro(c.actor, c.id) });
  } catch (e) {
    return fallo(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await contexto(params);
  if (!c) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ libro: await editarLibro(c.actor, c.id, await req.json().catch(() => ({}))) });
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await contexto(params);
  if (!c) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await borrarLibro(c.actor, c.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
