import { NextRequest, NextResponse } from "next/server";
import { fotosVisibles } from "@/lib/reposo/repositorio";
import { aFotoPublica } from "@/lib/reposo/unsplash";

export const dynamic = "force-dynamic";

// GET /api/reposo/fotos?orientacion=horizontal|vertical — pública (el reposo se ve antes del login).
// Solo fotos activas y no ocultas; URLs de images.unsplash.com con tamaño y UTM de atribución.
export async function GET(req: NextRequest) {
  const o = req.nextUrl.searchParams.get("orientacion");
  if (o !== null && o !== "horizontal" && o !== "vertical") {
    return NextResponse.json({ error: "orientacion debe ser horizontal o vertical" }, { status: 400 });
  }
  try {
    const fotos = await fotosVisibles(o ?? undefined);
    return NextResponse.json(fotos.map(aFotoPublica), { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (e) {
    console.error("[API/Reposo/fotos]", e);
    // Sin fotos el reposo cae al respaldo de partículas: mejor un arreglo vacío que un error
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
