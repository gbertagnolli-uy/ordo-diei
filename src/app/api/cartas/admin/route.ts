import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  adminListarCartas,
  adminCrearCarta,
  adminActualizarCarta,
  adminArchivarCarta,
  adminEliminarCarta,
  adminRestaurarCarta,
} from "@/lib/cartas/server";

export const dynamic = "force-dynamic";

/** Helper para verificar si el usuario actual es Padre o Madre */
async function verificarPermisoAdmin() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { autorizado: false, error: "No autenticado", status: 401, session: null };
  }
  const rol = session.user.rolFamiliar;
  if (rol !== "Padre" && rol !== "Madre") {
    return {
      autorizado: false,
      error: "Acceso denegado: solo Padre o Madre pueden administrar cartas.",
      status: 403,
      session,
    };
  }
  return { autorizado: true, error: null, status: 200, session };
}

// GET /api/cartas/admin — Lista completa de cartas para gestión administrativa
export async function GET() {
  try {
    const auth = await verificarPermisoAdmin();
    if (!auth.autorizado) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const cartas = await adminListarCartas();
    return NextResponse.json({ cartas });
  } catch (error) {
    console.error("[API/Cartas/Admin] GET:", error);
    return NextResponse.json({ error: "Error al listar las cartas" }, { status: 500 });
  }
}

// POST /api/cartas/admin — Crear una nueva carta manual
export async function POST(request: NextRequest) {
  try {
    const auth = await verificarPermisoAdmin();
    if (!auth.autorizado) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const creadorId = Number(auth.session!.user.id);
    const nuevaCarta = await adminCrearCarta(body, creadorId);

    return NextResponse.json({ ok: true, carta: nuevaCarta }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API/Cartas/Admin] POST:", error);
    const mensaje = error instanceof Error ? error.message : "Error al crear la carta";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}

// PUT /api/cartas/admin — Actualizar carta existente
export async function PUT(request: NextRequest) {
  try {
    const auth = await verificarPermisoAdmin();
    if (!auth.autorizado) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const id = Number(body.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "El ID de la carta es requerido" }, { status: 400 });
    }

    const cartaActualizada = await adminActualizarCarta(id, body);
    return NextResponse.json({ ok: true, carta: cartaActualizada });
  } catch (error: unknown) {
    console.error("[API/Cartas/Admin] PUT:", error);
    const mensaje = error instanceof Error ? error.message : "Error al actualizar la carta";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}

// DELETE /api/cartas/admin — Eliminar carta definitivamente (borra también el progreso de los usuarios)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verificarPermisoAdmin();
    if (!auth.autorizado) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    let id = Number(searchParams.get("id"));

    if (!id || isNaN(id)) {
      try {
        const body = await request.json();
        id = Number(body?.id);
      } catch {
        // Fallback si no hay body
      }
    }

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "El ID de la carta es requerido" }, { status: 400 });
    }

    await adminEliminarCarta(id);
    return NextResponse.json({ ok: true, mensaje: "Carta eliminada correctamente" });
  } catch (error: unknown) {
    console.error("[API/Cartas/Admin] DELETE:", error);
    const mensaje = error instanceof Error ? error.message : "Error al eliminar la carta";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}

// PATCH /api/cartas/admin — Restaurar carta archivada
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verificarPermisoAdmin();
    if (!auth.autorizado) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const id = Number(body?.id);
    const accion = body?.accion; // "restaurar" | "archivar"

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "El ID de la carta es requerido" }, { status: 400 });
    }

    if (accion === "restaurar") {
      const carta = await adminRestaurarCarta(id);
      return NextResponse.json({ ok: true, mensaje: "Carta restaurada correctamente", carta });
    } else {
      const carta = await adminArchivarCarta(id);
      return NextResponse.json({ ok: true, mensaje: "Carta archivada correctamente", carta });
    }
  } catch (error: unknown) {
    console.error("[API/Cartas/Admin] PATCH:", error);
    const mensaje = error instanceof Error ? error.message : "Error al actualizar estado de la carta";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
