import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { CONFIGURACION_DEFAULT, ConfiguracionRutina } from "@/lib/rutina/tipos";

export const dynamic = "force-dynamic";

// Memoria compartida en servidor como respaldo en runtime
let memoriaRutinaConfig: ConfiguracionRutina = CONFIGURACION_DEFAULT;

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(memoriaRutinaConfig);
  } catch (err) {
    console.error("[API/Rutina] GET error:", err);
    return NextResponse.json(CONFIGURACION_DEFAULT);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await req.json()) as ConfiguracionRutina;
    if (!body || !Array.isArray(body.etapas)) {
      return NextResponse.json({ error: "Estructura de rutina inválida" }, { status: 400 });
    }

    memoriaRutinaConfig = {
      ...CONFIGURACION_DEFAULT,
      ...body,
      version: (body.version || 1) + 1,
    };

    return NextResponse.json({ ok: true, config: memoriaRutinaConfig });
  } catch (err) {
    console.error("[API/Rutina] POST error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
