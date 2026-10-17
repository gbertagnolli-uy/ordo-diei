import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { agregarLibro } from "@/lib/homeschooling/servidor/lectura";
import { datosLibro, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// POST { alumnoId, titulo, autor?, paginasTotal?, estado? }: agrega un libro a la lista de lectura (un padre a cualquier hijo; un hijo, a la suya)
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => agregarLibro(s, datosLibro.parse(body)));
}
