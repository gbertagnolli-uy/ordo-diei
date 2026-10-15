import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { borrarLibro, editarLibro } from "@/lib/homeschooling/servidor/lectura";
import { cambiosLibro, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => editarLibro(s, await idDe(params), cambiosLibro.parse(body)));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await borrarLibro(s, await idDe(params));
    return { ok: true };
  });
}
