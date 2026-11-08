// GET ?tipo=personal|familiar → { grupos, etiquetas, categorias } (lane 284). Siembra lo predeterminado la primera vez.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { listarCatalogo } from "@/lib/diario/servidor-catalogo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    return NextResponse.json(await listarCatalogo(actor, tipo));
  } catch (e) {
    return fallo(e);
  }
}
