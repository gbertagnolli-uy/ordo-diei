import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { cambiarPlan, quitarPlan } from "@/lib/homeschooling/servidor/planes";
import { claveFecha, diasSemana, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const cambios = z.object({ estado: z.enum(["activo", "pausado", "finalizado"]).optional(), fin: claveFecha.optional(), diasSemana: diasSemana.optional() });

// PATCH { estado?, fin?, diasSemana? }: pausa, reanuda, termina o reprograma un plan (se recalcula lo que falta)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => cambiarPlan(s, await idDe(params), cambios.parse(body), hoyEnFamilia()), { soloPadres: true });
}

// DELETE: quita un plan sin días cumplidos
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await quitarPlan(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
