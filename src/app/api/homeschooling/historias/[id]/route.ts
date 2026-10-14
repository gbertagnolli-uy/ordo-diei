import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { borrarHistoria, editarHistoria } from "@/lib/homeschooling/servidor/neuro";
import { datosHistoria, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => editarHistoria(s, await idDe(params), datosHistoria.parse(body)), { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await borrarHistoria(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
