import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { configurarAnio } from "@/lib/homeschooling/servidor/planes";
import { datosAnio, leerJson } from "../_comun";

export const dynamic = "force-dynamic";

// POST { alumnoIds, vacaciones, fiestas }: marca vacaciones y fiestas como días sin clase de esos hijos y reparte de nuevo sus planes. Solo padres
export async function POST(req: NextRequest) {
  const body = await leerJson(req);
  return conSesion((s) => configurarAnio({ ...datosAnio.parse(body), actorId: s.id, hoy: hoyEnFamilia() }), { soloPadres: true });
}
