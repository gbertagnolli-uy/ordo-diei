// GET /api/diario/grafo?tipo= → { nodos, aristas, truncado? } — las entradas con enlaces y los enlaces entre ellas (lane 295)
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { grafoGeneral } from "@/lib/diario/servidor-grafo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    return NextResponse.json(await grafoGeneral(actor, tipo));
  } catch (e) {
    return fallo(e);
  }
}
