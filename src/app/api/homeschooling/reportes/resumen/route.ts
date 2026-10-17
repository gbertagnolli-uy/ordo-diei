import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { resumenHoras } from "@/lib/homeschooling/servidor/horas";
import { alumnoDe } from "../../_comun";

export const dynamic = "force-dynamic";

// GET ?alumnoId=&desde=&hasta=: horas, lecciones, notas, cursos y evidencias destacadas del período (un hijo solo el suyo)
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  return conSesion((s) => resumenHoras(s, { alumnoId: alumnoDe(req) ?? s.id, desde: q.get("desde") ?? "", hasta: q.get("hasta") ?? "" }));
}
