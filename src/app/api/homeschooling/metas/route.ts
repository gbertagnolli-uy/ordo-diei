import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { fijarMeta } from "@/lib/homeschooling/servidor/horas";
import { idPositivo, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

const datos = z.object({ alumnoId: idPositivo, materiaId: idPositivo, horas: z.number().int().min(0).max(2000) });

// PUT { alumnoId, materiaId, horas }: meta de horas por alumno y materia (0 la quita). Solo padres
export async function PUT(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => fijarMeta(s, datos.parse(body)), { soloPadres: true });
}
