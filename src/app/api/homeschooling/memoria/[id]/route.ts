import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { z } from "zod";
import { calificarRecitado, editarMemoria, quitarDeMemoria } from "@/lib/homeschooling/servidor/memoria";
import { datosRecitado, idDe, leerJson } from "../../_comun";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// POST { nivel: otra_vez | dificil | bien | facil }: el padre califica el recitado
export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => calificarRecitado(s, await idDe(params), datosRecitado.parse(body).nivel), { soloPadres: true });
}

const datosEdicion = z.object({ titulo: z.string().trim().min(1, "Falta el título").max(150), texto: z.string().min(5, "El texto es muy corto").max(5000) });

// PATCH { titulo, texto }: corrige un texto de memoria (el repaso y el avance no se tocan)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await leerJson(req);
  return conSesion(async (s) => {
    await editarMemoria(s, await idDe(params), datosEdicion.parse(body));
    return { ok: true };
  }, { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return conSesion(async (s) => {
    await quitarDeMemoria(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
