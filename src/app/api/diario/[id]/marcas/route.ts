// PATCH { favorita?, fijada? } → { entrada } — estrella y chincheta de una entrada, sin tocar el resto (lane 285).
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado } from "@/lib/diario/api";
import { cambiarMarcas } from "@/lib/diario/servidor";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Entrada inválida" }, { status: 400 });
  try {
    return NextResponse.json({ entrada: await cambiarMarcas(actor, id, await req.json().catch(() => ({}))) });
  } catch (e) {
    return fallo(e);
  }
}
