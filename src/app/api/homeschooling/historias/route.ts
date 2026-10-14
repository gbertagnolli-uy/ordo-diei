import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearHistoria, listarHistorias } from "@/lib/homeschooling/servidor/neuro";
import { datosHistoria, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// GET: biblioteca de historias sociales del padre. POST: crea una (de 3 a 5 pasos)
export const GET = () => conSesion((s) => listarHistorias(s), { soloPadres: true });

export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => crearHistoria(s, datosHistoria.parse(body)), { soloPadres: true });
}
