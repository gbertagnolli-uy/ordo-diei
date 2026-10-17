import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import {
  archivarHabito,
  editarHabito,
  NoAutorizadoError,
  NoEncontradoError,
} from "@/lib/habitos/server";

export const dynamic = "force-dynamic";

// PATCH /api/habitos/[id] — editar un hábito (solo el creador)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "ID no válido" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const actorId = Number(session.user.id);

    try {
      const habito = await editarHabito(actorId, id, body, esPadre(session.user.rolFamiliar));
      return NextResponse.json({ habito });
    } catch (err) {
      if (err instanceof NoAutorizadoError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      if (err instanceof NoEncontradoError) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      return NextResponse.json({ error: err instanceof Error ? err.message : "Error de validación" }, { status: 400 });
    }
  } catch (error) {
    console.error("[API/Habitos/[id]] PATCH:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE /api/habitos/[id] — archivar un hábito (solo el creador)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "ID no válido" }, { status: 400 });

    const actorId = Number(session.user.id);
    try {
      await archivarHabito(actorId, id, esPadre(session.user.rolFamiliar));
      return NextResponse.json({ ok: true });
    } catch (err) {
      if (err instanceof NoAutorizadoError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      if (err instanceof NoEncontradoError) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      return NextResponse.json({ error: err instanceof Error ? err.message : "Error al archivar" }, { status: 400 });
    }
  } catch (error) {
    console.error("[API/Habitos/[id]] DELETE:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
