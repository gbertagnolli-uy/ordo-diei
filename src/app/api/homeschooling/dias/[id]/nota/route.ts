import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { calificarDia, notaDelDia } from "@/lib/homeschooling/servidor/calificaciones";
import { idDe, leerJson, notaDeDia } from "../../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// GET: la nota del día (o null)
export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => notaDelDia(s, await idDe(params)), { soloPadres: true });
}

// PUT { puntaje, comentario? }: pone o cambia la nota del día
export async function PUT(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    const d = notaDeDia.parse(body);
    return calificarDia(s, await idDe(params), d.puntaje, d.comentario);
  }, { soloPadres: true });
}
