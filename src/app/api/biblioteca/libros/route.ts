// GET → { libros } (todos, con el estado de quien pregunta) · POST (padres) { titulo, autor?, sinopsis?, portadaUrl?, estanteIds?, archivos } → { libro } — lane 270
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { crearLibro, listarLibros } from "@/lib/biblioteca/servidor";

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
    return NextResponse.json({ libros: await listarLibros(actor) });
  } catch (e) {
    return fallo(e);
  }
}

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ libro: await crearLibro(actor, await req.json().catch(() => ({}))) });
  } catch (e) {
    return fallo(e);
  }
}
