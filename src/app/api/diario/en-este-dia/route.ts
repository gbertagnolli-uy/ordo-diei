// GET /api/diario/en-este-dia?tipo=&md=MM-DD → { diaMes, entradas } — las entradas de ese día y mes en todos los años (lane 289). Sin `md`, el de hoy.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { enEsteDia } from "@/lib/diario/servidor-linea";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    return NextResponse.json(await enEsteDia(actor, tipo, req.nextUrl.searchParams.get("md")));
  } catch (e) {
    return fallo(e);
  }
}
