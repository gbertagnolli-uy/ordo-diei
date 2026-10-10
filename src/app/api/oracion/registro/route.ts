import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { HABITOS_VALIDOS, fechaEditable, getEstadosOracion, hoyEnFamilia, registrarOracion } from "@/lib/oracion/server";
import { usuariosObjetivo } from "@/lib/oracion/permisos";

const MARCAS = ["hecho", "justificado", null];

// PUT /api/oracion/registro — marcar una oración como rezada, justificada o borrar la marca (null)
// body: { habito, marca, fecha?: "yyyy-MM-dd" (hoy por defecto, hasta 7 días atrás), motivo?, usuarioIds? }
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fecha = body.fecha ?? hoyEnFamilia();
    if (!HABITOS_VALIDOS.includes(body.habito) || !MARCAS.includes(body.marca ?? null) || !fechaEditable(fecha)) {
      return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });
    }

    const ids = await usuariosObjetivo(session, body.usuarioIds);
    if (!ids) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const motivo = typeof body.motivo === "string" ? body.motivo.slice(0, 200) : null;
    await registrarOracion({ actorId: Number(session.user.id), usuarioIds: ids, habito: body.habito, fecha, marca: body.marca ?? null, motivo });
    return NextResponse.json({ estados: await getEstadosOracion(ids) });
  } catch (error) {
    console.error("[API/Oracion] PUT registro:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
