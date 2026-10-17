import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { reclamarSubidaNivel } from "@/lib/nivelesServidor";

// POST /api/users/subir-nivel — { nivelPrevio?: number }
// Reclama los puntos de regalo (200 puntos por nivel subido) y registra el nuevo nivel como visto.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const nivelPrevio = typeof body?.nivelPrevio === "number" ? body.nivelPrevio : null;
    const resultado = await reclamarSubidaNivel(Number(session.user.id), nivelPrevio);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo reclamar el nivel" },
      { status: 400 },
    );
  }
}
