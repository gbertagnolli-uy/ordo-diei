import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { borrarNota, editarNota } from "@/lib/homeschooling/servidor/calificaciones";
import { cambiosNota, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => editarNota(s, await idDe(params), cambiosNota.parse(body)), { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await borrarNota(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
