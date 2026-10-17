import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { z } from "zod";
import { borrarPeriodo, editarPeriodo } from "@/lib/homeschooling/servidor/boletin";
import { claveFecha, idDe } from "../../_comun";

export const dynamic = "force-dynamic";

const datos = z.object({ nombre: z.string().trim().min(1, "Falta el nombre").max(80), inicio: claveFecha, fin: claveFecha });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({}));
  return conSesion(async (s) => editarPeriodo(s, await idDe(params), datos.parse(body)), { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return conSesion(async (s) => {
    await borrarPeriodo(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
