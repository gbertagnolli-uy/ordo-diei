import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { armarBoletin, guardarComentarioBoletin } from "@/lib/homeschooling/servidor/boletin";
import { datosComentarioBoletin, idDe, leerJson } from "../../../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; alumnoId: string }> };

const ids = async (params: Ctx["params"]) => {
  const { alumnoId } = await params;
  return [await idDe(params), Number(alumnoId)] as const;
};

// GET: el boletín del alumno en ese período
export async function GET(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    const [periodoId, alumnoId] = await ids(params);
    return armarBoletin(s, alumnoId, periodoId);
  }, { soloPadres: true });
}

// PUT { comentario }: el comentario del padre en el boletín
export async function PUT(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    const [periodoId, alumnoId] = await ids(params);
    await guardarComentarioBoletin(s, periodoId, alumnoId, datosComentarioBoletin.parse(body).comentario);
    return { ok: true };
  }, { soloPadres: true });
}
