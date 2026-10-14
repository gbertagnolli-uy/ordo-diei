import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { responderRepaso } from "@/lib/homeschooling/servidor/repasos";
import { idDe, idPositivo, leerJson, respuestaElegida } from "../../_comun";

export const dynamic = "force-dynamic";

// POST { preguntaId, elegida }: acierto/fallo, explicación y el próximo repaso
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await leerJson(req);
  const datos = z.object({ preguntaId: idPositivo, elegida: respuestaElegida }).parse(body);
  return conSesion(async (s) => responderRepaso(s.id, await idDe(params), datos.preguntaId, datos.elegida));
}
