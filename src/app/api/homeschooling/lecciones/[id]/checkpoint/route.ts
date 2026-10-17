import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { responderCheckpoint } from "@/lib/homeschooling/servidor/quiz";
import { idDe, idPositivo, leerJson, respuestaElegida } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST { preguntaId, elegida }: { correcta, explicacion } — la corrección es del servidor
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await leerJson(req);
  const datos = z.object({ preguntaId: idPositivo, elegida: respuestaElegida }).parse(body);
  return conSesion(async (s) => responderCheckpoint(s, await idDe(params), datos.preguntaId, datos.elegida));
}
