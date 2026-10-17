import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { actualizarMaterial, borrarMaterial, obtenerMaterial } from "@/lib/homeschooling/servidor/materiales";
import { cambiosMaterial, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => obtenerMaterial(s, await idDe(params)));
}

// PATCH { titulo?, tipo?, limiteImpresiones?, contenido?, orden? }. Solo padres
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => actualizarMaterial(s, await idDe(params), cambiosMaterial.parse(body)), { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await borrarMaterial(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
