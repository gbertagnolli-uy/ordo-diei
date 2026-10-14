import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { vistaNoLectivo } from "@/lib/homeschooling/servidor/planes";
import { claveFecha, idPositivo } from "../../_comun";

export const dynamic = "force-dynamic";

const datos = z.object({ alumnoIds: z.array(idPositivo).min(1, "Falta el alumno"), fecha: claveFecha });

// POST: «antes/después» de marcar un día sin clase en los planes activos de esos alumnos (no guarda nada)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return conSesion((s) => vistaNoLectivo({ actorId: s.id, hoy: hoyEnFamilia(), ...datos.parse(body) }), { soloPadres: true });
}
