import { NextRequest } from "next/server";
import { exigir, manejar } from "@/lib/liturgia/api";
import { leerLibro } from "@/lib/liturgia/lecturas";
import { parsearClave, parsearTipoLibro, parsearVersion } from "@/lib/liturgia/parametros";

export const dynamic = "force-dynamic";

// GET /api/liturgia/libro?tipo=psalterium&clave=Psalterium/92&version= → Documento (Proprium, Psalterium, Ordinarium)
export async function GET(req: NextRequest) {
  return manejar(req, async (repo, sp) => {
    return leerLibro(
      repo,
      exigir(parsearVersion(sp.get("version"))),
      exigir(parsearTipoLibro(sp.get("tipo"))),
      exigir(parsearClave(sp.get("clave"))),
    );
  });
}
