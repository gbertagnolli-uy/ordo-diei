import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearProducto, listarProductosAdmin } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

// GET /api/admin/tienda/productos — todos los productos (padres)
export const GET = () => conSesion((s) => listarProductosAdmin(s.rol), { soloPadres: true });

// POST /api/admin/tienda/productos — crea un producto
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return conSesion(async (s) => {
    const p = await crearProducto({ id: s.id, rol: s.rol }, body);
    return { id: p.id };
  }, { soloPadres: true });
}
