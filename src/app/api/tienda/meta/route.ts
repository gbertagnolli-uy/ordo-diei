import { NextRequest } from "next/server";
import { conSesion, entero } from "@/lib/tienda/http";
import { fijarMeta } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

// PUT /api/tienda/meta { productoId } fija la meta de ahorro; DELETE la quita
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return conSesion(async (s) => {
    const productoId = entero(body.productoId);
    if (!productoId) throw new Error("Producto no válido");
    await fijarMeta(s.id, productoId);
    return { ok: true };
  });
}

export const DELETE = () =>
  conSesion(async (s) => {
    await fijarMeta(s.id, null);
    return { ok: true };
  });
