import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { borrarActividad, editarActividad, participantesDe } from "@/lib/homeschooling/servidor/actividades";
import { datosActividad, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// GET: participantes (getEventAttendees de Roost)
export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => participantesDe(s, await idDe(params)));
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => editarActividad(s, await idDe(params), datosActividad.parse(body)), { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await borrarActividad(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
