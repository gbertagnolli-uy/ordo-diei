import { NextRequest } from "next/server";
import { conSesion, entero } from "@/lib/tienda/http";
import { resolverCompra } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

// PATCH { accion: "aprobar" | "rechazar" | "cancelar", motivo? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({}));
  const id = entero((await params).id);
  return conSesion(async (s) => {
    if (!id || !["aprobar", "rechazar", "cancelar"].includes(body.accion)) throw new Error("Datos no válidos");
    return resolverCompra({ id: s.id, rol: s.rol }, id, body.accion, typeof body.motivo === "string" ? body.motivo : undefined);
  }, { soloPadres: true });
}
