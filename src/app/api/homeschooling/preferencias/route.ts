import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { guardarPreferencia, obtenerPreferencia } from "@/lib/homeschooling/servidor/neuro";
import { alumnoDe, datosPreferencia, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// GET ?alumnoId=: preferencias de un alumno (un hijo, las suyas)
export async function GET(req: NextRequest) {
  return conSesion((s) => obtenerPreferencia(s, alumnoDe(req) ?? s.id));
}

// PUT { alumnoId?, modoRelajado?, primeroDespues?, recompensaDespues? }: el padre cambia todo; el alumno solo su modo relajado
export async function PUT(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => {
    const { alumnoId, ...cambios } = datosPreferencia.parse(body);
    return guardarPreferencia(s, alumnoId ?? s.id, cambios);
  });
}
