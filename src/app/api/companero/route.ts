import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { comprarAccesorio, elegirPersonaje, equiparAccesorio, festejarNivel, nombrarCompanero } from "@/lib/engagement/companeroServidor";
import { marcarBienvenidaVista, resumenRachaAppDe } from "@/lib/engagement/servidor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const pedidoId = Number(req.nextUrl.searchParams.get("usuarioId"));
    const usuarioId = Number.isInteger(pedidoId) && pedidoId > 0 ? pedidoId : Number(session.user.id);
    const rachaApp = await resumenRachaAppDe(usuarioId);
    return NextResponse.json({ ok: true, rachaApp });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo consultar" }, { status: 400 });
  }
}

// POST /api/companero — { accion: "elegir", personaje, nombre? } | "nombrar" | "festejar" | "comprar" { clave } | "equipar" { clave, puesto } | "bienvenida".
// Cada persona solo toca el suyo.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const usuarioId = Number(session.user.id);
    const body = await req.json().catch(() => ({}));
    if (body.accion === "elegir") await elegirPersonaje(usuarioId, body.personaje, body.nombre);
    else if (body.accion === "nombrar") await nombrarCompanero(usuarioId, body.nombre);
    else if (body.accion === "festejar") await festejarNivel(usuarioId);
    else if (body.accion === "comprar") await comprarAccesorio(usuarioId, body.clave);
    else if (body.accion === "equipar") await equiparAccesorio(usuarioId, body.clave, body.puesto);
    else if (body.accion === "bienvenida") await marcarBienvenidaVista(usuarioId);
    else return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar" }, { status: 400 });
  }
}
