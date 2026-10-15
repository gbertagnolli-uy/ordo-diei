import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { marcarLeidos, misAvisos } from "@/lib/homeschooling/servidor/avisos";
import { datosLeidos, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// GET: mis avisos y cuántos tengo sin leer
export async function GET() {
  return conSesion((s) => misAvisos(s));
}

// POST { ids? }: marca como leídos esos avisos (o todos)
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion(async (s) => ({ marcados: await marcarLeidos(s, datosLeidos.parse(body).ids) }));
}
