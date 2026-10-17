import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { z } from "zod";
import { cambiarMotivoNoLectivo, quitarNoLectivo } from "@/lib/homeschooling/servidor/planes";
import { idDe } from "../../_comun";

export const dynamic = "force-dynamic";

const datos = z.object({ motivo: z.string().max(200) });

// PATCH: cambia el motivo de un día sin clase
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({}));
  return conSesion(async (s) => cambiarMotivoNoLectivo({ actorId: s.id, id: await idDe(params), ...datos.parse(body) }), { soloPadres: true });
}

// DELETE: quita un día sin clase y recalcula los planes activos del alumno
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return conSesion(async (s) => quitarNoLectivo({ actorId: s.id, id: await idDe(params), hoy: hoyEnFamilia() }), { soloPadres: true });
}
