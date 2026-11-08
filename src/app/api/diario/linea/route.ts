// GET /api/diario/linea?tipo=&orden=fecha-desc|fecha-asc|edicion&cursor=&categoria=<id|ninguna> → { items, siguiente, conteoMeses } (lane 289)
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { esOrdenLinea, leerCategoria } from "@/lib/diario/linea";
import { paginaLinea } from "@/lib/diario/servidor-linea";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const p = req.nextUrl.searchParams;
  const tipo = tipoDe(p.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  const orden = p.get("orden") ?? "fecha-desc";
  if (!esOrdenLinea(orden)) return NextResponse.json({ error: "Orden inválido" }, { status: 400 });
  try {
    return NextResponse.json(await paginaLinea(actor, tipo, orden, p.get("cursor"), leerCategoria(p.get("categoria"))));
  } catch (e) {
    return fallo(e);
  }
}
