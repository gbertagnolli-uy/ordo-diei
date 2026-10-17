import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { resolverEntrada } from "@/lib/homeschooling/servidor/materiales";
import { vistaMaterial } from "@/lib/homeschooling/material";
import { leerJson } from "../../_comun";

export const dynamic = "force-dynamic";

const cuerpo = z.object({ entrada: z.string().trim().min(1).max(60000) });

// POST { entrada }: qué es lo que se pegó (tipo, proveedor, título mejorado con la página, vista previa). No guarda nada
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion(async () => {
    const det = await resolverEntrada(cuerpo.parse(body).entrada);
    return { ...det, vista: vistaMaterial({ tipo: det.tipo, proveedor: det.proveedor, externoId: det.externoId, url: det.url }) };
  }, { soloPadres: true });
}
