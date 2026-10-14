import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { completarLeccion, desmarcarLeccion } from "@/lib/homeschooling/servidor/progreso";
import { alumnoDe, idDe } from "../../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// POST: el alumno (siempre quien tiene la sesión) marca la lección como terminada. No da puntos: los da la Tarea del día.
export async function POST(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => completarLeccion(s.id, await idDe(params)));
}

// DELETE ?alumnoId=: solo Padre/Madre desmarcan una lección
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    const alumnoId = alumnoDe(req);
    if (!alumnoId) throw new Error("Falta el alumno");
    return desmarcarLeccion(s, alumnoId, await idDe(params));
  });
}
