import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { calificarRecitado, quitarDeMemoria } from "@/lib/homeschooling/servidor/memoria";
import { datosRecitado, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// POST { nivel: otra_vez | dificil | bien | facil }: el padre califica el recitado
export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => calificarRecitado(s, await idDe(params), datosRecitado.parse(body).nivel), { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await quitarDeMemoria(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
