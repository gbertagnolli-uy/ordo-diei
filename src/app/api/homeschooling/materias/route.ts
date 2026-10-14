import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearMateria, listarMaterias } from "@/lib/homeschooling/servidor/cursos";
import { datosMateria, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// GET: materias visibles (el padre todas; un hijo las que tienen un plan suyo). POST: crea una (padre)
export const GET = () => conSesion((s) => listarMaterias(s));

export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => crearMateria(s, datosMateria.parse(body)), { soloPadres: true });
}
