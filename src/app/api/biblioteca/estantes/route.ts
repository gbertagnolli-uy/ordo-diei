// GET → { estantes } · POST { nombre } · PATCH { id, nombre?, orden? } · DELETE ?id=N (padres) — lane 270
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { borrarEstante, crearEstante, editarEstante, listarEstantes } from "@/lib/biblioteca/servidor";

export const dynamic = "force-dynamic";

const fallo = (e: unknown) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });

async function actorDeSesion() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
}

export async function GET() {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ estantes: await listarEstantes() });
  } catch (e) {
    return fallo(e);
  }
}

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ estante: await crearEstante(actor, await req.json().catch(() => ({}))) });
  } catch (e) {
    return fallo(e);
  }
}

export async function PATCH(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ estante: await editarEstante(actor, await req.json().catch(() => ({}))) });
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await borrarEstante(actor, Number(req.nextUrl.searchParams.get("id")));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
