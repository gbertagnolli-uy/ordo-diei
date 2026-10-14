import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearRecurso } from "@/lib/homeschooling/servidor/cursos";
import { datosRecurso, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// POST: crea un curso (recurso) dentro de una materia
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => crearRecurso(s, datosRecurso.parse(body)), { soloPadres: true });
}
