import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { crearLeccion } from "@/lib/homeschooling/servidor/cursos";
import { datosLeccion, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// POST: agrega una lección al final del curso (actualiza el total y recalcula los planes activos)
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => crearLeccion(s, datosLeccion.parse(body), hoyEnFamilia()), { soloPadres: true });
}
