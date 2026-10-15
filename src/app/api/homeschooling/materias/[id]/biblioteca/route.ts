import { NextRequest } from "next/server";
import { z } from "zod";
import { conSesion } from "@/lib/tienda/http";
import { importarDeBiblioteca } from "@/lib/homeschooling/servidor/paquetes";
import { idDe, leerJson } from "../../../_comun";

export const dynamic = "force-dynamic";

// POST { clave }: agrega a la materia un curso de la biblioteca católica
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await leerJson(req);
  return conSesion(async (s) => importarDeBiblioteca(s, await idDe(params), z.object({ clave: z.string().max(60) }).parse(body).clave), { soloPadres: true });
}
