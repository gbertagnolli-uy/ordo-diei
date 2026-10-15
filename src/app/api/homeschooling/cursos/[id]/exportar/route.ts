import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { nombreArchivoPaquete } from "@/lib/homeschooling/paquete";
import { exportarCurso } from "@/lib/homeschooling/servidor/paquetes";

export const dynamic = "force-dynamic";

// GET: descarga el curso como archivo .ordo-curso.json (padres)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rol = String(session.user.rolFamiliar ?? "");
  if (!esPadre(rol)) return NextResponse.json({ error: "Solo un padre o una madre pueden hacer esto" }, { status: 403 });
  try {
    const id = Number((await params).id);
    const paquete = await exportarCurso({ id: Number(session.user.id), rol }, id);
    return new NextResponse(JSON.stringify(paquete, null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${nombreArchivoPaquete(paquete.curso.titulo)}"` },
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 400;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status });
  }
}
