import { NextRequest } from "next/server";
import { exigir, manejar } from "@/lib/liturgia/api";
import { leerDia } from "@/lib/liturgia/lecturas";
import { parsearFecha, parsearVersion } from "@/lib/liturgia/parametros";

export const dynamic = "force-dynamic";

// GET /api/liturgia/dia?fecha=YYYY-MM-DD&version=1906 → DiaLiturgico
export async function GET(req: NextRequest) {
  return manejar(req, async (repo, sp) => {
    return leerDia(repo, exigir(parsearVersion(sp.get("version"))), exigir(parsearFecha(sp.get("fecha"))));
  });
}
