// GET /api/diario/enlaces/<id>?tipo= → { entrada, salientes, entrantes } — la entrada enlazada y sus enlaces; 404 si no existe o no está en ese diario (lane 290)
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { enlacesDeEntrada } from "@/lib/diario/servidor-enlaces";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  const id = Number((await params).id);
  if (!tipo || !Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    return NextResponse.json(await enlacesDeEntrada(actor, tipo, id));
  } catch (e) {
    return fallo(e);
  }
}
