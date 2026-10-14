import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { borrarMateria, editarMateria, obtenerMateria } from "@/lib/homeschooling/servidor/cursos";
import { datosMateria, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => obtenerMateria(s, await idDe(params)));
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(
    async (s) => editarMateria(s, await idDe(params), datosMateria.partial().extend({ activa: z.boolean().optional() }).parse(body)),
    { soloPadres: true }
  );
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await borrarMateria(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
