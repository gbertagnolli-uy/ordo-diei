// POST { tipo, ids } → guarda el orden de los lugares (lane 296).
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { reordenarLugares } from "@/lib/diario/servidor-lugares";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if (!tipo) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    await reordenarLugares(actor, tipo, body.ids);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
