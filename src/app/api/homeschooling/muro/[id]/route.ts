import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { borrarPublicacion, fijarPublicacion } from "@/lib/homeschooling/servidor/muro";
import { datosFijar, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// PATCH { fijada }: fija o suelta una publicación (padres)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    await fijarPublicacion(s, await idDe(params), datosFijar.parse(body).fijada);
    return { ok: true };
  }, { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await borrarPublicacion(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
