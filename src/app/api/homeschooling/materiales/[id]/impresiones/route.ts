import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { darImpresionExtra, resumenImpresiones } from "@/lib/homeschooling/servidor/impresiones";
import { idDe, idPositivo, leerJson } from "../../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// GET: qué imprimió cada hijo de este material (padres)
export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => resumenImpresiones(s, await idDe(params)), { soloPadres: true });
}

// POST { alumnoId }: le da una impresión más a ese hijo (padres)
export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    await darImpresionExtra(s, await idDe(params), z.object({ alumnoId: idPositivo }).parse(body).alumnoId);
    return { ok: true };
  }, { soloPadres: true });
}
