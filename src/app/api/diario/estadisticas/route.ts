// GET /api/diario/estadisticas?tipo=personal|familiar → { filas, truncado } (lane 287). El navegador calcula todo con esas filas.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { filasEstadisticas } from "@/lib/diario/servidor-estadisticas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    return NextResponse.json(await filasEstadisticas(actor, tipo));
  } catch (e) {
    return fallo(e);
  }
}
