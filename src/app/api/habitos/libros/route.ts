import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { cargarLibro, getEstadosHabitos, validarLibro } from "@/lib/habitos/server";
import { usuariosObjetivo } from "@/lib/habitos/permisos";

export const dynamic = "force-dynamic";

// POST /api/habitos/libros — cargar el libro que se empieza a leer (o corregir el que está en curso)
// body: { habitoId, titulo, paginas, usuarioIds? }
export async function POST(req: NextRequest) {
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

    try {
      const terminados = await cargarLibro(ids, habitoId, validarLibro(body));
      const estados = await getEstadosHabitos(ids);
      return NextResponse.json({ estados, terminados });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Error al cargar el libro" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[API/Habitos/Libros] POST:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
