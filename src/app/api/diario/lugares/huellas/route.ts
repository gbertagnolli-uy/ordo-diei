// GET ?tipo=personal|familiar → { huellas: [{ lugarId, cantidad, primera, ultima }] } (lane 297). Cuántas entradas tiene cada lugar.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { huellasDeLugares } from "@/lib/diario/servidor-huellas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    return NextResponse.json({ huellas: await huellasDeLugares(actor, tipo) });
  } catch (e) {
    return fallo(e);
  }
}
