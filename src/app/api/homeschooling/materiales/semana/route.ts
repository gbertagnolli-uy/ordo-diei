import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { cargarSemana } from "@/lib/homeschooling/servidor/materiales";
import { datosCargaSemana, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";

// POST { alumnoId, dias: [{ fecha, lineas }] }: carga de una vez el material de varios días de un hijo (una línea por material). Solo padres
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => {
    const d = datosCargaSemana.parse(body);
    return cargarSemana(s, d.alumnoId, d.dias);
  }, { soloPadres: true });
}
