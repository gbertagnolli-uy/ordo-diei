import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { comprarAccesorio, elegirPersonaje, equiparAccesorio, festejarNivel, nombrarCompanero } from "@/lib/engagement/companeroServidor";

export const dynamic = "force-dynamic";

// POST /api/companero — { accion: "elegir", personaje, nombre? } | "nombrar" | "festejar" | "comprar" { clave } | "equipar" { clave, puesto }.
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
    else return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar" }, { status: 400 });
  }
}
