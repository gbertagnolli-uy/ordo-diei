import { NextRequest } from "next/server";
import { exigir, manejar } from "@/lib/liturgia/api";
import { leerIndice } from "@/lib/liturgia/lecturas";
import { parsearTipoLibro, parsearVersion } from "@/lib/liturgia/parametros";

export const dynamic = "force-dynamic";

// GET /api/liturgia/indice?tipo=&version= → lista de claves y títulos de un libro
export async function GET(req: NextRequest) {
  return manejar(req, async (repo, sp) => {
    return leerIndice(repo, exigir(parsearVersion(sp.get("version"))), exigir(parsearTipoLibro(sp.get("tipo"))));
  });
}
