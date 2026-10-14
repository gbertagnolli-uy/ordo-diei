import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { quitarNoLectivo } from "@/lib/homeschooling/servidor/planes";
import { idDe } from "../../_comun";

export const dynamic = "force-dynamic";

// DELETE: quita un día sin clase y recalcula los planes activos del alumno
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return conSesion(async (s) => quitarNoLectivo({ actorId: s.id, id: await idDe(params), hoy: hoyEnFamilia() }), { soloPadres: true });
}
