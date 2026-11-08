// POST { tipo, latitud, longitud } → { lugar }: la ubicación pasa a ser un lugar (el que ya esté a 200 m, el de ese nombre, o uno nuevo) (lane 296).
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { lugarDeUbicacion } from "@/lib/diario/servidor-lugares";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if (!tipo) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    return NextResponse.json({ lugar: await lugarDeUbicacion(actor, tipo, body) });
  } catch (e) {
    return fallo(e);
  }
}
