// GET /api/diario/grafo/<id>?tipo=&profundidad=1|2|3 → { nodos, aristas, centro } — el grafo local de una entrada; 404 si no existe o no está en ese diario (lane 295)
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { profundidadValida } from "@/lib/diario/grafo";
import { grafoLocal } from "@/lib/diario/servidor-grafo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const p = req.nextUrl.searchParams;
  const tipo = tipoDe(p.get("tipo"));
  const id = Number((await params).id);
  if (!tipo || !Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    return NextResponse.json(await grafoLocal(actor, tipo, id, profundidadValida(p.get("profundidad"))));
  } catch (e) {
    return fallo(e);
  }
}
