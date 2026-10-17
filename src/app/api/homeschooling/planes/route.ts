import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearPlan } from "@/lib/homeschooling/servidor/planes";
import { datosPlan } from "../_comun";

export const dynamic = "force-dynamic";

// POST /api/homeschooling/planes: crea el plan de un alumno y materializa sus días lectivos
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return conSesion((s) => crearPlan({ actorId: s.id, ...datosPlan.parse(body) }), { soloPadres: true });
}
