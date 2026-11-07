// POST → Notification marcada como leída. Lane 276 (D11).
import { NextRequest } from "next/server";
import { responder } from "@/lib/social/servidor/http";
import { marcarLeida } from "@/lib/social/servidor/notificaciones";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return responder((actor) => marcarLeida(actor, id));
}
