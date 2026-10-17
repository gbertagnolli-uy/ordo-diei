import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { listaDeLectura } from "@/lib/homeschooling/servidor/lectura";
import { idDe } from "../../../_comun";

export const dynamic = "force-dynamic";

// GET: la lista de lectura del alumno (un padre, la de cualquier hijo; un hijo, la suya)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return conSesion(async (s) => listaDeLectura(s, await idDe(params)));
}
