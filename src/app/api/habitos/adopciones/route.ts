import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  adoptar,
  ajustarAdopcion,
  getEstadosHabitos,
  validarLibro,
} from "@/lib/habitos/server";
import { usuariosObjetivo } from "@/lib/habitos/permisos";

export const dynamic = "force-dynamic";

// POST /api/habitos/adopciones — adoptar uno o más hábitos
// body: { items: [{ habitoId, dias?, ancla?, libro?: { titulo, paginas } }], usuarioIds? }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = await usuariosObjetivo(session, body.usuarioIds);
    if (!ids) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Se requiere un listado de hábitos a adoptar" }, { status: 400 });
    }

    let items;
    try {
      items = body.items.map((it: { habitoId: unknown; dias?: unknown; ancla?: unknown; libro?: unknown }) => ({
        habitoId: Number(it.habitoId),
        dias: it.dias !== undefined ? Number(it.dias) : undefined,
        ancla: typeof it.ancla === "string" ? it.ancla : undefined,
        libro: it.libro !== undefined ? validarLibro(it.libro) : undefined,
      }));
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Libro no válido" }, { status: 400 });
    }

    if (items.some((it: { habitoId: number }) => !Number.isInteger(it.habitoId))) {
      return NextResponse.json({ error: "ID de hábito no válido" }, { status: 400 });
    }

    await adoptar(ids, items);
    const estados = await getEstadosHabitos(ids);
    return NextResponse.json({ estados });
  } catch (error) {
    console.error("[API/Habitos/Adopciones] POST:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH /api/habitos/adopciones — ajustar una adopción existente (días, ancla o activo)
// body: { habitoId, dias?, ancla?, activo?, usuarioIds? }
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = await usuariosObjetivo(session, body.usuarioIds);
    if (!ids) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const habitoId = Number(body.habitoId);
    if (!Number.isInteger(habitoId)) {
      return NextResponse.json({ error: "ID de hábito no válido" }, { status: 400 });
    }

    await ajustarAdopcion(ids, habitoId, {
      dias: body.dias !== undefined ? Number(body.dias) : undefined,
      ancla: typeof body.ancla === "string" ? body.ancla : undefined,
      activo: typeof body.activo === "boolean" ? body.activo : undefined,
    });

    const estados = await getEstadosHabitos(ids);
    return NextResponse.json({ estados });
  } catch (error) {
    console.error("[API/Habitos/Adopciones] PATCH:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
