import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { alternarReaccion } from "@/lib/homeschooling/servidor/comentarios";
import { datosReaccion, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// POST { objetivo: { comentarioId } | { evidenciaId }, emoji }: pone o saca la reacción; devuelve el resumen
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => {
    const d = datosReaccion.parse(body);
    return alternarReaccion(s, d.objetivo, d.emoji);
  });
}
