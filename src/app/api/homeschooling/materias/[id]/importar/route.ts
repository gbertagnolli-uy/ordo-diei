import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { importarCurso } from "@/lib/homeschooling/servidor/paquetes";
import { idDe, leerJson } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST <contenido del archivo .ordo-curso.json>: crea el curso dentro de la materia
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await leerJson(req);
  return conSesion(async (s) => importarCurso(s, await idDe(params), body), { soloPadres: true });
}
