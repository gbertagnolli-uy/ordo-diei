import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { marcarVista } from "@/lib/homeschooling/servidor/neuro";
import { idDe } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST: el alumno vio la historia; deja de mostrarse
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return conSesion(async (s) => marcarVista(s, await idDe(params)));
}
