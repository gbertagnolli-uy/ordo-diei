// POST { tipo, ids } → guarda el orden de las etiquetas o de las categorías de etiquetas (lane 284).
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { reordenar } from "@/lib/diario/servidor-catalogo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ recurso: string }> }) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const { recurso } = await params;
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if ((recurso !== "etiquetas" && recurso !== "grupos") || !tipo) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    await reordenar(actor, tipo, recurso, body.ids);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
