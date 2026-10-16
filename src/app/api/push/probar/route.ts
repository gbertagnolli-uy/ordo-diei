import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { avisoPrueba } from "@/lib/push/avisos";
import { enviarAviso, pushConfigurado } from "@/lib/push/servidor";

export const dynamic = "force-dynamic";

// POST /api/push/probar — manda un aviso de prueba a los dispositivos de la persona con sesión
export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!pushConfigurado()) return NextResponse.json({ error: "Los avisos todavía no están configurados en el servidor" }, { status: 503 });
  const llegaron = await enviarAviso(Number(session.user.id), avisoPrueba(), { unoPorDia: false });
  if (llegaron === 0) return NextResponse.json({ error: "No hay ningún dispositivo con los avisos activados" }, { status: 404 });
  return NextResponse.json({ ok: true, llegaron });
}
