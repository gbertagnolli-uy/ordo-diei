// GET ?tipo=personal|familiar → { lugares } · POST { tipo, nombre, latitud, longitud, icono? } → { ok, id } (lane 296). Lugares frecuentes del diario.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { crearLugar, listarLugares } from "@/lib/diario/servidor-lugares";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    return NextResponse.json({ lugares: await listarLugares(actor, tipo) });
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
    return NextResponse.json({ ok: true, id: await crearLugar(actor, tipo, body) });
  } catch (e) {
    return fallo(e);
  }
}
