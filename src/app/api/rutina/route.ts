import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { CONFIGURACION_DEFAULT } from "@/lib/rutina/tipos";
import { validarRutinaFamiliar } from "@/lib/rutina/validarRutina";
import { guardarRutinaFamiliar, leerRutinaFamiliar } from "@/lib/rutina/servidorRutina";

export const dynamic = "force-dynamic";

// Rutina base de la familia (lane 259). `guardada: false` = todavía no hay fila en la base.
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const rutina = await leerRutinaFamiliar();
    if (!rutina) {
      return NextResponse.json({
        guardada: false,
        etapas: CONFIGURACION_DEFAULT.etapas,
        semanalConfig: CONFIGURACION_DEFAULT.semanalConfig,
        version: 0,
      });
    }
    return NextResponse.json({ guardada: true, ...rutina });
  } catch (err) {
    console.error("[API/Rutina] GET error:", err);
    return NextResponse.json({ error: "No se pudo leer la rutina" }, { status: 500 });
  }
}

// Solo padres. Cuerpo: { etapas, semanalConfig }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!esPadre(session.user.rolFamiliar)) {
    return NextResponse.json({ error: "Solo los padres pueden cambiar la rutina" }, { status: 403 });
  }
  try {
    const v = validarRutinaFamiliar(await req.json().catch(() => null));
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    const rutina = await guardarRutinaFamiliar(v.etapas, v.semanalConfig, Number(session.user.id));
    return NextResponse.json({ ok: true, guardada: true, ...rutina });
  } catch (err) {
    console.error("[API/Rutina] POST error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
