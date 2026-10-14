import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { actuarSobreEvidencia, borrarEvidencia, obtenerEvidencia } from "@/lib/homeschooling/servidor/evidencia";
import { accionEvidencia, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => obtenerEvidencia(s, await idDe(params)));
}

// PATCH { accion: aprobar | ajustar | destacar | quitar_destacada | reenviar }. Aprobar, ajustar y destacar: solo padres
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => actuarSobreEvidencia(s, await idDe(params), accionEvidencia.parse(body)));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await borrarEvidencia(s, await idDe(params));
    return { ok: true };
  });
}
