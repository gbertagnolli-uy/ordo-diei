import { NextRequest } from "next/server";
import { conSesion, entero } from "@/lib/tienda/http";
import { desbloquearProducto } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

// POST { usuarioId } desbloquea el producto para esa persona; DELETE { usuarioId } lo vuelve a bloquear
const manejar = (desbloquear: boolean) => async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const body = await req.json().catch(() => ({}));
  const id = entero((await params).id);
  return conSesion(async (s) => {
    const usuarioId = entero(body.usuarioId);
    if (!id || !usuarioId) throw new Error("Datos no válidos");
    await desbloquearProducto({ id: s.id, rol: s.rol }, id, usuarioId, desbloquear);
    return { ok: true };
  }, { soloPadres: true });
};

export const POST = manejar(true);
export const DELETE = manejar(false);
