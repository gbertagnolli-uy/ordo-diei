// PATCH { tipo, nombre, latitud, longitud, icono? } · DELETE ?tipo= — editar o borrar un lugar (lane 296). Un lugar con entradas no se borra.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { borrarLugar, editarLugar } from "@/lib/diario/servidor-lugares";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if (!tipo || !Number.isInteger(Number(id))) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    await editarLugar(actor, tipo, Number(id), body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const { id } = await params;
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo || !Number.isInteger(Number(id))) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    await borrarLugar(actor, tipo, Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
