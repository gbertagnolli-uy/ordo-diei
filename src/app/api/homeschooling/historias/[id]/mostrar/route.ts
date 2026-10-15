import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { mostrarHoy } from "@/lib/homeschooling/servidor/neuro";
import { idDe, idPositivo, leerJson } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST { alumnoIds }: «Mostrar hoy» — la historia le aparece al alumno arriba de «Hoy aprendo» hasta que la vea
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await leerJson(req);
  const { alumnoIds } = z.object({ alumnoIds: z.array(idPositivo).min(1, "Elegí al menos un alumno") }).parse(body);
  return conSesion(async (s) => mostrarHoy(s, await idDe(params), alumnoIds), { soloPadres: true });
}
