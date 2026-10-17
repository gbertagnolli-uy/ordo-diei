import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { cursosDeMateria, reordenarRecursos } from "@/lib/homeschooling/servidor/cursos";
import { alumnoDe, idDe, leerJson, listaIds } from "../../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// GET ?alumnoId=&incluir=lecciones: cursos de la materia con su progreso (y lecciones) en una sola consulta
export async function GET(req: NextRequest, { params }: Ctx) {
  const incluir = new URL(req.url).searchParams.get("incluir") === "lecciones";
  return conSesion(async (s) => cursosDeMateria(s, await idDe(params), alumnoDe(req), incluir));
}

// PUT { ids }: nuevo orden de los cursos
export async function PUT(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    await reordenarRecursos(s, await idDe(params), listaIds.parse(body).ids);
    return { ok: true };
  }, { soloPadres: true });
}
