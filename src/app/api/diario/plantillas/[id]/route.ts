// PATCH { tipo, ...campos } · DELETE ?tipo= — editar o borrar una plantilla (lane 286).
// Con el cuerpo `{ tipo, predeterminada }` solo se marca o desmarca como predeterminada (la estrella de la lista).
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { borrarPlantilla, editarPlantilla, fijarPredeterminada } from "@/lib/diario/servidor-plantillas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if (!tipo || !Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    const soloMarca = Object.keys(body).every((k) => k === "tipo" || k === "predeterminada") && "predeterminada" in body;
    if (soloMarca) await fijarPredeterminada(actor, tipo, id, body.predeterminada);
    else await editarPlantilla(actor, tipo, id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const id = Number((await params).id);
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo || !Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    await borrarPlantilla(actor, tipo, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
