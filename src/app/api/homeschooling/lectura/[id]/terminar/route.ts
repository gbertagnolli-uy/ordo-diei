import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { terminarLibro } from "@/lib/homeschooling/servidor/lectura";
import { datosCierreLibro, idDe, leerJson } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST { estrellas?, narracion?, fecha? }: lo terminó
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await leerJson(req);
  return conSesion(async (s) => terminarLibro(s, await idDe(params), datosCierreLibro.parse(body)));
}
