import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { tareaDelDiaAlumno } from "@/lib/homeschooling/servidor/progreso";
import { idDe } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST: la Tarea del día del alumno (la crea si falta, p. ej. un día adelantado). Después se completa con /api/tasks/[id]/complete
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return conSesion(async (s) => tareaDelDiaAlumno(s.id, await idDe(params)));
}
