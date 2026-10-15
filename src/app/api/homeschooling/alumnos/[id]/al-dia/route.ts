import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { ponerseAlDia, vistaPonerseAlDia } from "@/lib/homeschooling/servidor/planes";
import { claveFecha, idDe, leerJson } from "../../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// GET: qué planes del alumno están atrasados y cómo quedarían repartidos (no escribe)
export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => vistaPonerseAlDia(s.id, await idDe(params), hoyEnFamilia()), { soloPadres: true });
}

// POST { extender?: { [planId]: "YYYY-MM-DD" } }: reparte lo atrasado desde hoy; los planes de `extender` también alargan su fin
export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    const { extender } = z.object({ extender: z.record(z.string().regex(/^\d+$/), claveFecha).optional() }).parse(body);
    const porPlan = Object.fromEntries(Object.entries(extender ?? {}).map(([k, v]) => [Number(k), v]));
    return ponerseAlDia(s.id, await idDe(params), hoyEnFamilia(), porPlan);
  }, { soloPadres: true });
}
