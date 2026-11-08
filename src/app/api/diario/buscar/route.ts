// GET /api/diario/buscar?tipo=personal|familiar&q=&etiquetas=&... → ResultadoBusqueda (lane 285). Parámetros: ver `leerFiltro`.
import { NextRequest, NextResponse } from "next/server";
import { leerFiltro } from "@/lib/diario/busqueda";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { buscarEntradas } from "@/lib/diario/servidor-busqueda";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    return NextResponse.json(await buscarEntradas(actor, tipo, leerFiltro(req.nextUrl.searchParams)));
  } catch (e) {
    return fallo(e);
  }
}
