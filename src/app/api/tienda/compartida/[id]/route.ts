import { NextRequest } from "next/server";
import { conSesion, entero } from "@/lib/tienda/http";
import { CompraError, responderCompraCompartida } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

const ACCIONES = ["aceptar", "rechazar", "cancelar"] as const;
type Accion = (typeof ACCIONES)[number];

// PATCH /api/tienda/compartida/[id] — { accion: "aceptar" | "rechazar" | "cancelar" }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return conSesion((s) => {
    const solicitudId = entero(id);
    const accion = body.accion as Accion;
    if (!solicitudId || !ACCIONES.includes(accion)) {
      throw new CompraError("Acción o solicitud no válida");
    }
    return responderCompraCompartida(s.id, solicitudId, accion);
  });
}
