import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { marcarNoLectivo } from "@/lib/homeschooling/servidor/planes";
import { claveFecha, idPositivo } from "../_comun";

export const dynamic = "force-dynamic";

const datos = z.object({
  alumnoIds: z.array(idPositivo).min(1, "Falta el alumno"),
  fecha: claveFecha,
  motivo: z.string().max(200).default(""),
});

// POST /api/homeschooling/no-lectivos: «hoy no hay clase» (una fila por alumno) y recalcula sus planes
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return conSesion((s) => marcarNoLectivo({ actorId: s.id, hoy: hoyEnFamilia(), ...datos.parse(body) }), { soloPadres: true });
}
