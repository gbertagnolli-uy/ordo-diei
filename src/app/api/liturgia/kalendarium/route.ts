import { NextRequest } from "next/server";
import { exigir, manejar } from "@/lib/liturgia/api";
import { leerKalendarium } from "@/lib/liturgia/lecturas";
import { parsearVersion } from "@/lib/liturgia/parametros";

export const dynamic = "force-dynamic";

// GET /api/liturgia/kalendarium?version= → Kalendarium de la versión (índice por mes del Proprium Sanctorum)
export async function GET(req: NextRequest) {
  return manejar(req, async (repo, sp) => {
    return leerKalendarium(repo, exigir(parsearVersion(sp.get("version"))));
  });
}
