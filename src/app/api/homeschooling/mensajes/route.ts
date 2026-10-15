import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { contarSinLeer, conversaciones, enviar } from "@/lib/homeschooling/servidor/mensajes";
import { datosMensaje, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// GET: con quién puedo hablar, el último mensaje y los no leídos; con ?resumen=1 solo la cantidad sin leer (liviano, para la barra)
export async function GET(req: NextRequest) {
  const resumen = new URL(req.url).searchParams.get("resumen") === "1";
  return conSesion(async (s) => (resumen ? { sinLeer: await contarSinLeer(s.id) } : conversaciones(s)));
}

// POST { paraId, texto }: manda un mensaje a otro integrante de la familia
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => {
    const d = datosMensaje.parse(body);
    return enviar(s, d.paraId, d.texto);
  });
}
