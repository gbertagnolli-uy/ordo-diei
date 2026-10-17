import { NextRequest } from "next/server";
import { exigir, manejar } from "@/lib/liturgia/api";
import { leerMartirologio } from "@/lib/liturgia/lecturas";
import { parsearFecha, parsearVersion } from "@/lib/liturgia/parametros";

export const dynamic = "force-dynamic";

// GET /api/liturgia/martyrologium?fecha=&version= → Documento del día (por MM-DD)
export async function GET(req: NextRequest) {
  return manejar(req, async (repo, sp) => {
    return leerMartirologio(repo, exigir(parsearVersion(sp.get("version"))), exigir(parsearFecha(sp.get("fecha"))));
  });
}
