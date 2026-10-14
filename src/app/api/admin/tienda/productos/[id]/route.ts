import { NextRequest } from "next/server";
import { conSesion, entero } from "@/lib/tienda/http";
import { actualizarProducto, eliminarProducto } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => ({}));
  const id = entero((await params).id);
  return conSesion(async (s) => {
    if (!id) throw new Error("ID no válido");
    await actualizarProducto({ id: s.id, rol: s.rol }, id, body);
    return { ok: true };
  }, { soloPadres: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = entero((await params).id);
  return conSesion(async (s) => {
    if (!id) throw new Error("ID no válido");
    return eliminarProducto({ id: s.id, rol: s.rol }, id);
  }, { soloPadres: true });
}
