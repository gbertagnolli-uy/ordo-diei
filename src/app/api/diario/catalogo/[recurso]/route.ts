// POST { tipo, ...campos } → crea una etiqueta, una categoría de etiquetas o una categoría de entrada (lane 284).
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { crear, esRecurso } from "@/lib/diario/servidor-catalogo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ recurso: string }> }) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const { recurso } = await params;
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if (!esRecurso(recurso) || !tipo) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, id: await crear(actor, tipo, recurso, body) });
  } catch (e) {
    return fallo(e);
  }
}
