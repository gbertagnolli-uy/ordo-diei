import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { duplicarCurso } from "@/lib/homeschooling/servidor/paquetes";
import { idDe, leerJson } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST { materiaId? }: copia el curso (lecciones, preguntas y material) en su materia o en otra. Sin planes ni avances
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = (await leerJson(req)) as { materiaId?: unknown };
  const materiaId = Number(body.materiaId);
  return conSesion(async (s) => duplicarCurso(s, await idDe(params), Number.isInteger(materiaId) && materiaId > 0 ? materiaId : undefined), { soloPadres: true });
}
