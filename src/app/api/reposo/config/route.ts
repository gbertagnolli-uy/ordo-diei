import { NextResponse } from "next/server";
import { repoReposo } from "@/lib/reposo/repositorio";
import { CONFIG_POR_DEFECTO } from "@/lib/reposo/unsplash";

export const dynamic = "force-dynamic";

// GET /api/reposo/config — pública: lo mínimo que necesita la pantalla de reposo.
export async function GET() {
  let c = CONFIG_POR_DEFECTO;
  try {
    c = await repoReposo.config();
  } catch (e) {
    console.error("[API/Reposo/config]", e);
  }
  return NextResponse.json(
    { segundosLogin: c.segundosLogin, segundosSesion: c.segundosSesion, mostrarRefCatecismo: c.mostrarRefCatecismo },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=600" } },
  );
}
