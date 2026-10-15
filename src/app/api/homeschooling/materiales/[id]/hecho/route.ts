import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { marcarMaterialHecho } from "@/lib/homeschooling/servidor/materiales";
import { idDe, leerJson } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST { hecho }: el alumno marca su material suelto como hecho (o lo desmarca)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await leerJson(req);
  return conSesion(async (s) => marcarMaterialHecho(s, await idDe(params), z.object({ hecho: z.boolean() }).parse(body).hecho));
}
