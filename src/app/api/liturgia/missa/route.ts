import { NextRequest } from "next/server";
import { exigir, manejar } from "@/lib/liturgia/api";
import { leerMisa } from "@/lib/liturgia/lecturas";
import { parsearFecha, parsearVersion } from "@/lib/liturgia/parametros";

export const dynamic = "force-dynamic";

// GET /api/liturgia/missa?fecha=&version= → Documento de la Misa del día
export async function GET(req: NextRequest) {
  return manejar(req, async (repo, sp) => {
    return leerMisa(repo, exigir(parsearVersion(sp.get("version"))), exigir(parsearFecha(sp.get("fecha"))));
  });
}
