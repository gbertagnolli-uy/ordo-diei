import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  crearHabito,
  getCatalogo,
  getEstadosHabitos,
} from "@/lib/habitos/server";
import { esPadre, usuariosObjetivo } from "@/lib/habitos/permisos";

export const dynamic = "force-dynamic";

// GET /api/habitos?usuarioId=1&usuarioId=2 — catálogo y estado de hábitos
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const ids = await usuariosObjetivo(session, req.nextUrl.searchParams.getAll("usuarioId"));
    if (!ids) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const [catalogo, estados] = await Promise.all([
      getCatalogo(Number(session.user.id)),
      getEstadosHabitos(ids),
    ]);

    return NextResponse.json({ catalogo, estados });
  } catch (error) {
    console.error("[API/Habitos] GET:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/habitos — crear un hábito nuevo (los hijos lo crean pendiente de aprobación)
// body: { nombre, categoria, franja, ancla, minimo?, icono?, adoptar?: { dias?, ancla? } }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { nombre, categoria, franja, ancla, minimo, icono, imagen, adoptar } = body;

    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0 || nombre.trim().length > 80) {
      return NextResponse.json({ error: "El nombre debe tener entre 1 y 80 caracteres" }, { status: 400 });
    }
    if (!ancla || typeof ancla !== "string" || ancla.trim().length === 0 || ancla.trim().length > 120) {
      return NextResponse.json({ error: "El ancla debe tener entre 1 y 120 caracteres" }, { status: 400 });
    }
    if (minimo !== undefined && minimo !== null && (typeof minimo !== "string" || minimo.trim().length > 120)) {
      return NextResponse.json({ error: "La versión mínima no puede superar los 120 caracteres" }, { status: 400 });
    }
    if (!["oracion", "orden", "cuidado"].includes(categoria)) {
      return NextResponse.json({ error: "Categoría no válida" }, { status: 400 });
    }
    if (!["manana", "tarde", "noche"].includes(franja)) {
      return NextResponse.json({ error: "Franja no válida" }, { status: 400 });
    }

    const userId = Number(session.user.id);
    const habito = await crearHabito(userId, {
      nombre,
      categoria,
      franja,
      ancla,
      minimo,
      icono,
      imagen,
      adoptar,
    }, esPadre(session.user.rolFamiliar));

    const estados = await getEstadosHabitos([userId]);
    return NextResponse.json({ habito, estados });
  } catch (error) {
    console.error("[API/Habitos] POST:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error interno" }, { status: 400 });
  }
}
