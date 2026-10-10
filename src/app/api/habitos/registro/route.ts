import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  fechaEditable,
  getEstadosHabitos,
  hoyEnFamilia,
  registrar,
} from "@/lib/habitos/server";
import { usuariosObjetivo } from "@/lib/habitos/permisos";

export const dynamic = "force-dynamic";

const MARCAS_VALIDAS = ["hecho", "justificado", "no", null];

// PUT /api/habitos/registro — marcar un hábito como hecho, justificado, no o borrarlo (null)
// body: { habitoId, marca: "hecho" | "justificado" | "no" | null, fecha?, nota?, paginas?, usuarioIds? }
// paginas: obligatorio al marcar "hecho" en "Leer un libro"
export async function PUT(req: NextRequest) {
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

    const marca = body.marca ?? null;
    if (!MARCAS_VALIDAS.includes(marca)) {
      return NextResponse.json({ error: "Marca no válida" }, { status: 400 });
    }

    const fecha = body.fecha ?? hoyEnFamilia();
    if (!fechaEditable(fecha)) {
      return NextResponse.json({ error: "Fecha no válida (solo hoy o hasta 7 días atrás)" }, { status: 400 });
    }

    const nota = typeof body.nota === "string" ? body.nota.slice(0, 300) : null;
    const actorId = Number(session.user.id);

    try {
      const recompensas = await registrar({
        actorId,
        usuarioIds: ids,
        habitoId,
        fecha,
        marca,
        nota,
        paginas: body.paginas,
      });

      const estados = await getEstadosHabitos(ids);
      return NextResponse.json({ estados, recompensas });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Error al registrar hábito" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[API/Habitos/Registro] PUT:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
