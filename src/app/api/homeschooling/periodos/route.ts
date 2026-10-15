import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearPeriodo, crearTrimestres, listarPeriodos } from "@/lib/homeschooling/servidor/boletin";
import { datosPeriodo, datosTrimestres, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

export const GET = () => conSesion((s) => listarPeriodos(s), { soloPadres: true });

// POST { nombre, inicio, fin } crea un período; POST { anio } crea los tres trimestres de ese año
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    if (typeof (body as { anio?: unknown }).anio === "number") return { creados: await crearTrimestres(s, datosTrimestres.parse(body).anio) };
    return crearPeriodo(s, datosPeriodo.parse(body));
  }, { soloPadres: true });
}
