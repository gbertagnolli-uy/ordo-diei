// PATCH { tipo, ...campos } · DELETE ?tipo= — editar o borrar un elemento del catálogo (lane 284).
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { borrar, editar, esRecurso } from "@/lib/diario/servidor-catalogo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ recurso: string; id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const { recurso, id } = await params;
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if (!esRecurso(recurso) || !tipo || !Number.isInteger(Number(id))) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    await editar(actor, tipo, recurso, Number(id), body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const { recurso, id } = await params;
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!esRecurso(recurso) || !tipo || !Number.isInteger(Number(id))) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  try {
    await borrar(actor, tipo, recurso, Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
