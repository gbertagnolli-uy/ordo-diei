import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { colaDeHoy, listaDeMemoria } from "@/lib/homeschooling/servidor/memoria";
import { idDe } from "../../../_comun";

export const dynamic = "force-dynamic";

// GET: la memoria del alumno; con ?cola=1 solo lo que toca recitar hoy (padres)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cola = new URL(req.url).searchParams.get("cola") === "1";
  return conSesion(async (s) => (cola ? colaDeHoy(s, await idDe(params)) : listaDeMemoria(s, await idDe(params))));
}
