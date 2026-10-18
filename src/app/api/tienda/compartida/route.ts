import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { crearCompraCompartida, listarComprasCompartidas } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

// GET /api/tienda/compartida — Solicitudes de compra compartida en las que participa la persona en sesión
export async function GET() {
  return conSesion((s) => listarComprasCompartidas(s.id));
}

// POST /api/tienda/compartida — { productoId, opcion, participantes: [{ usuarioId, costos }] }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return conSesion((s) => crearCompraCompartida(s.id, body));
}
