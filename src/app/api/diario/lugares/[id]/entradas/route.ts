// GET ?tipo=personal|familiar → { entradas } las entradas de ese lugar, las más nuevas primero (lane 297).
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { entradasDeLugar } from "@/lib/diario/servidor-huellas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const { id } = await params;
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo || !Number.isInteger(Number(id))) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    return NextResponse.json({ entradas: await entradasDeLugar(actor, tipo, Number(id)) });
  } catch (e) {
    return fallo(e);
  }
}
