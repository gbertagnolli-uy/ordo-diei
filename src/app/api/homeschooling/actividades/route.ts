import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearActividad, listarActividades } from "@/lib/homeschooling/servidor/actividades";
import { datosActividad, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// GET ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD: el padre ve todas; un hijo, las suyas
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  return conSesion((s) => listarActividades(s, { desde: q.get("desde") ?? undefined, hasta: q.get("hasta") ?? undefined }));
}

// POST: crea una actividad (padres); suma horas a cada participante
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => crearActividad(s, datosActividad.parse(body)), { soloPadres: true });
}
