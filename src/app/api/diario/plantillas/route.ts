// GET ?tipo= → { plantillas } (siembra las de ejemplo la primera vez) · POST { tipo, nombre, contenido?, etiquetas?, predeterminada? } → { id } — lane 286.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { crearPlantilla, listarPlantillas } from "@/lib/diario/servidor-plantillas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    return NextResponse.json({ plantillas: await listarPlantillas(actor, tipo) });
  } catch (e) {
    return fallo(e);
  }
}

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, id: await crearPlantilla(actor, tipo, body) });
  } catch (e) {
    return fallo(e);
  }
}
