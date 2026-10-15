import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { borrarRecurso, editarRecurso, obtenerRecurso } from "@/lib/homeschooling/servidor/cursos";
import { datosRecurso, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => obtenerRecurso(s, await idDe(params)));
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  const datos = datosRecurso.omit({ materiaId: true, tipo: true }).partial().parse(body);
  return conSesion(async (s) => editarRecurso(s, await idDe(params), datos), { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await borrarRecurso(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
