import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { aprobar, getSolicitudes, rechazar, type ItemSolicitud } from "@/lib/habitos/aprobaciones";

export const dynamic = "force-dynamic";

const TIPOS = ["habito", "adopcion", "registro"];

// GET /api/habitos/aprobaciones — solicitudes de hábitos pendientes (solo padres)
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!esPadre(session.user.rolFamiliar)) {
      return NextResponse.json({ error: "Solo los padres pueden revisar solicitudes" }, { status: 403 });
    }
    return NextResponse.json(await getSolicitudes());
  } catch (error) {
    console.error("[API/Habitos/Aprobaciones] GET:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/habitos/aprobaciones — aprobar o rechazar solicitudes (una o muchas a la vez)
// body: { accion: "aprobar" | "rechazar", items: [{ tipo: "habito" | "adopcion" | "registro", id }] }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!esPadre(session.user.rolFamiliar)) {
      return NextResponse.json({ error: "Solo los padres pueden revisar solicitudes" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const items: ItemSolicitud[] = Array.isArray(body.items)
      ? body.items.map((i: { tipo?: unknown; id?: unknown }) => ({ tipo: i.tipo, id: Number(i.id) }))
      : [];
    if (
      (body.accion !== "aprobar" && body.accion !== "rechazar") ||
      items.length === 0 ||
      items.some((i) => !TIPOS.includes(i.tipo) || !Number.isInteger(i.id))
    ) {
      return NextResponse.json({ error: "Solicitud no válida" }, { status: 400 });
    }

    if (body.accion === "aprobar") await aprobar(items);
    else await rechazar(items);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/Habitos/Aprobaciones] POST:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
