import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { leerMuro, publicarAviso } from "@/lib/homeschooling/servidor/muro";
import { datosAviso, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// GET: el muro de la familia (avisos y logros) y el día litúrgico de hoy
export const GET = () => conSesion((s) => leerMuro(s));

// POST { titulo, cuerpo?, fijada? }: un aviso de los padres (llega a la campana de los hijos)
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => {
    const d = datosAviso.parse(body);
    return publicarAviso(s, d);
  }, { soloPadres: true });
}
