import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { leccionesDeCurso, reordenarLecciones } from "@/lib/homeschooling/servidor/cursos";
import { alumnoDe, idDe, leerJson, listaIds } from "../../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// GET ?alumnoId=: lecciones del curso con `is_completed` según el avance del alumno
export async function GET(req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => leccionesDeCurso(s, await idDe(params), alumnoDe(req)));
}

// PUT { ids }: nuevo orden de las lecciones
export async function PUT(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    await reordenarLecciones(s, await idDe(params), listaIds.parse(body).ids);
    return { ok: true };
  }, { soloPadres: true });
}
