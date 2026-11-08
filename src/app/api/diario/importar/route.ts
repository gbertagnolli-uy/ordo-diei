// POST /api/diario/importar { tipo, accion: "catalogo", catalogo } → { grupos, etiquetas, categorias, avisos }
//                          { tipo, accion: "entradas", entradas: EntradaLote[] } → { creadas, duplicadas, rechazadas } (lane 292)
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { importarLote, prepararCatalogoImport } from "@/lib/diario/servidor-importar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const tipo = tipoDe(body.tipo);
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    if (body.accion === "catalogo") return NextResponse.json(await prepararCatalogoImport(actor, tipo, body.catalogo));
    if (body.accion === "entradas") return NextResponse.json(await importarLote(actor, tipo, body.entradas));
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (e) {
    return fallo(e);
  }
}
