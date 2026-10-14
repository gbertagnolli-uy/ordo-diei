import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { calificarFinal } from "@/lib/homeschooling/servidor/quiz";
import { idDe, leerJson, respuestaElegida } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST { respuestas: { [preguntaId]: índice } }: crea el intento; si aprueba completa la lección
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await leerJson(req);
  const { respuestas } = z.object({ respuestas: z.record(z.string(), respuestaElegida) }).parse(body);
  const numericas = Object.fromEntries(Object.entries(respuestas).map(([k, v]) => [Number(k), v]));
  return conSesion(async (s) => calificarFinal(s, await idDe(params), numericas));
}
