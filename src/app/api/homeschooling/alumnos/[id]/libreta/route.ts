import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { libretaDe } from "@/lib/homeschooling/servidor/calificaciones";
import { idDe } from "../../../_comun";

export const dynamic = "force-dynamic";

// GET: la libreta del alumno (notas por materia, promedios). Solo padres
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return conSesion(async (s) => libretaDe(s, await idDe(params)), { soloPadres: true });
}
