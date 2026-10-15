import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { registrarLectura } from "@/lib/homeschooling/servidor/lectura";
import { datosSesionLectura, idDe, leerJson } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST { hastaPagina, minutos?, fecha? }: «hoy leí hasta la página N»
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await leerJson(req);
  return conSesion(async (s) => registrarLectura(s, await idDe(params), datosSesionLectura.parse(body)));
}
