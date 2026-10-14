import { NextRequest } from "next/server";
import { exigir, manejar } from "@/lib/liturgia/api";
import { leerMes } from "@/lib/liturgia/lecturas";
import { parsearAnioMes, parsearVersion } from "@/lib/liturgia/parametros";

export const dynamic = "force-dynamic";

// GET /api/liturgia/mes?anio=2026&mes=10&version=1906 → DiaLiturgico[] del mes
export async function GET(req: NextRequest) {
  return manejar(req, async (repo, sp) => {
    const { anio, mes } = exigir(parsearAnioMes(sp.get("anio"), sp.get("mes")));
    return leerMes(repo, exigir(parsearVersion(sp.get("version"))), anio, mes);
  });
}
