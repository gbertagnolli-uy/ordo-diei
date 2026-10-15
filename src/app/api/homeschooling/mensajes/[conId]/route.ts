import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { hilo } from "@/lib/homeschooling/servidor/mensajes";
import { idDe } from "../../_comun";

export const dynamic = "force-dynamic";

// GET: la conversación con esa persona (marca como leídos los mensajes que recibí)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ conId: string }> }) {
  return conSesion(async (s) => hilo(s, await idDe(params.then((p) => ({ id: p.conId })))));
}
