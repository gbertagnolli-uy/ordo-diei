import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { agregarDelCatalogo, crearPropia } from "@/lib/homeschooling/servidor/memoria";
import { datosCatalogoMemoria, datosMemoriaPropia, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// POST { alumnoIds, claves } agrega del catálogo; POST { alumnoId, titulo, texto } agrega un texto propio. Solo padres
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    if (z.object({ claves: z.array(z.unknown()) }).safeParse(body).success) {
      const d = datosCatalogoMemoria.parse(body);
      return { agregadas: await agregarDelCatalogo(s, d.alumnoIds, d.claves) };
    }
    return crearPropia(s, datosMemoriaPropia.parse(body));
  }, { soloPadres: true });
}
