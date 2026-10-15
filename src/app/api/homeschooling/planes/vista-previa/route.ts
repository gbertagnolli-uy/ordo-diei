import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { vistaPrevia } from "@/lib/homeschooling/servidor/planes";
import { claveFecha, datosPlan } from "../../_comun";

export const dynamic = "force-dynamic";

// POST /api/homeschooling/planes/vista-previa: el reparto sin guardar (alta y «antes/después» de un día sin clase)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return conSesion(
    () => vistaPrevia(datosPlan.extend({ noLectivosExtra: z.array(claveFecha).optional() }).parse(body)),
    { soloPadres: true }
  );
}
