import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { conductaDelDia, registrarConducta, resumenConducta } from "@/lib/conducta/server";

export const dynamic = "force-dynamic";

const fallo = (err: unknown) => {
  const status = (err as { status?: number }).status ?? 400;
  return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status });
};

// GET /api/conducta?usuarioId=&fecha= — con fecha: lo registrado ese día; sin fecha: resumen de 30 días.
// Cada miembro ve la suya; los padres, la de cualquiera.
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const propio = Number(session.user.id);
    const pedido = Number(req.nextUrl.searchParams.get("usuarioId")) || propio;
    if (pedido !== propio && !esPadre(session.user.rolFamiliar)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const fecha = req.nextUrl.searchParams.get("fecha");
    if (fecha) return NextResponse.json(await conductaDelDia(pedido, fecha));
    return NextResponse.json(await resumenConducta(pedido));
  } catch (err) {
    console.error("[API/Conducta] GET:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/conducta — body: { usuarioId, nivel (1–5), nota?, fecha? ("YYYY-MM-DD", hoy por defecto) } (solo padres)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    try {
      return NextResponse.json(await registrarConducta({ id: Number(session.user.id), rol: session.user.rolFamiliar }, body));
    } catch (err) {
      return fallo(err);
    }
  } catch (err) {
    console.error("[API/Conducta] POST:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
