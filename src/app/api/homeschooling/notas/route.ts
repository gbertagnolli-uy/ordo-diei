import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearNota } from "@/lib/homeschooling/servidor/calificaciones";
import { datosNota, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// POST { alumnoId, materiaId, titulo, tipo?, puntaje, comentario?, fecha }: una nota suelta (examen, proyecto, lectura…). Solo padres
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => crearNota(s, datosNota.parse(body)), { soloPadres: true });
}
