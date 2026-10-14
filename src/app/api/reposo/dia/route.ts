import { NextRequest, NextResponse } from "next/server";
import { repoPrisma } from "@/lib/liturgia/repositorio";
import { consultarDiaReposo, fechaHoyEnTz } from "@/lib/reposo/dia";

export const dynamic = "force-dynamic";

// GET /api/reposo/dia?fecha=YYYY-MM-DD — pública (SPEC idle-marco-fotos §5.4).
// Título del día (1906, APP_TZ) desde DiaLiturgico. null si no hay datos.
export async function GET(req: NextRequest) {
  try {
    const spFecha = req.nextUrl.searchParams.get("fecha");
    const fecha = spFecha && /^\d{4}-\d{2}-\d{2}$/.test(spFecha) ? spFecha : fechaHoyEnTz();

    const repo = await repoPrisma();
    const dia = await consultarDiaReposo(repo, fecha);

    if (!dia) {
      return NextResponse.json(null, {
        headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=1800" },
      });
    }

    return NextResponse.json(dia, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    // Si la base no tiene las tablas o falla la conexión, devuelve null sin romper (SPEC §4.6)
    console.warn("[API/Reposo/dia] No se pudo leer el título litúrgico:", err);
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } });
  }
}
