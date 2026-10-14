import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { borrarLeccion, editarLeccion, leccionPorId } from "@/lib/homeschooling/servidor/cursos";
import { datosLeccion, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// GET: la lección con la anterior y la siguiente (getRecordingById + getAdjacentRecordings)
export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => leccionPorId(s, await idDe(params)));
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  const datos = datosLeccion.omit({ recursoId: true }).partial().parse(body);
  return conSesion(async (s) => editarLeccion(s, await idDe(params), datos), { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await borrarLeccion(s, await idDe(params), hoyEnFamilia());
    return { ok: true };
  }, { soloPadres: true });
}
