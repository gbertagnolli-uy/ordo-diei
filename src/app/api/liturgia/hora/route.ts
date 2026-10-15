import { NextRequest } from "next/server";
import { exigir, manejar } from "@/lib/liturgia/api";
import { leerHora } from "@/lib/liturgia/lecturas";
import { parsearFecha, parsearHora, parsearVersion } from "@/lib/liturgia/parametros";

export const dynamic = "force-dynamic";

// GET /api/liturgia/hora?fecha=&version=&hora=Laudes → Documento con bloques resueltos
export async function GET(req: NextRequest) {
  return manejar(req, async (repo, sp) => {
    return leerHora(
      repo,
      exigir(parsearVersion(sp.get("version"))),
      exigir(parsearFecha(sp.get("fecha"))),
      exigir(parsearHora(sp.get("hora"))),
    );
  });
}
