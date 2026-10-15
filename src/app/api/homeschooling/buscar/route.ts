import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { buscarEnEstudio } from "@/lib/homeschooling/servidor/buscar";

export const dynamic = "force-dynamic";

// GET ?q=: busca en materias, cursos, lecciones, material, evidencias y actividades (el hijo, solo en lo suyo)
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return conSesion((s) => buscarEnEstudio(s, q));
}
