import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { comentar, conversacion } from "@/lib/homeschooling/servidor/comentarios";
import { datosComentario, destinoComentarioDe, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// GET ?leccionId= | ?materialId= | ?evidenciaId=: la conversación de la familia sobre eso
export async function GET(req: NextRequest) {
  return conSesion((s) => conversacion(s, destinoComentarioDe(req)));
}

// POST { destino, texto }: agrega un comentario (avisa a los padres o a los hijos según quién escribe)
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => {
    const d = datosComentario.parse(body);
    return comentar(s, d.destino, d.texto);
  });
}
