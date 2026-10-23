import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { obtenerHistorialAcciones, revertirAccion, TipoAccionHistorial } from "@/lib/admin/historiaAcciones";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!esPadre(session.user.rolFamiliar)) {
      return NextResponse.json({ error: "Solo los administradores pueden ver el historial de acciones" }, { status: 403 });
    }

    const acciones = await obtenerHistorialAcciones();
    return NextResponse.json({ acciones });
  } catch (error: any) {
    console.error("[API/Admin/HistoriaAcciones] GET error:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!esPadre(session.user.rolFamiliar)) {
      return NextResponse.json({ error: "Solo los administradores pueden revertir acciones" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { tipo, id } = body;

    if (!tipo || !id || !["tarea", "habito", "premio", "compra"].includes(tipo)) {
      return NextResponse.json({ error: "Parámetros inválidos (tipo e id son requeridos)" }, { status: 400 });
    }

    const res = await revertirAccion({
      actor: { id: Number(session.user.id), rol: session.user.rolFamiliar },
      tipo: tipo as TipoAccionHistorial,
      id: Number(id),
    });

    return NextResponse.json(res);
  } catch (error: any) {
    console.error("[API/Admin/HistoriaAcciones] POST error:", error);
    return NextResponse.json({ error: error.message || "Error al revertir acción" }, { status: 400 });
  }
}
