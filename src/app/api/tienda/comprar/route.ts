import { NextRequest } from "next/server";
import { conSesion, entero } from "@/lib/tienda/http";
import { CompraError, comprarProducto } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

// POST /api/tienda/comprar — { productoId, opcion, clave }. `clave` es de idempotencia: un reintento no cobra dos veces.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return conSesion(async (s) => {
    const productoId = entero(body.productoId);
    const opcion = Number.isInteger(body.opcion) && body.opcion >= 0 ? (body.opcion as number) : null;
    if (!productoId || opcion === null || typeof body.clave !== "string") throw new CompraError("Faltan datos de la compra");
    return comprarProducto(s.id, productoId, opcion, body.clave);
  });
}
