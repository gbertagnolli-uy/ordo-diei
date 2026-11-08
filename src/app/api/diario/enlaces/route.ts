// GET /api/diario/enlaces?tipo=&q=&excluir=<id> → { candidatos } — las entradas que ofrece la lista al escribir «[[» (lane 290)
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { candidatosDeEnlace } from "@/lib/diario/servidor-enlaces";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const p = req.nextUrl.searchParams;
  const tipo = tipoDe(p.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  const excluir = Number(p.get("excluir"));
  try {
    const consulta = (p.get("q") ?? "").slice(0, 80);
    return NextResponse.json({ candidatos: await candidatosDeEnlace(actor, tipo, consulta, Number.isInteger(excluir) && excluir > 0 ? excluir : null) });
  } catch (e) {
    return fallo(e);
  }
}
