// GET ?skip&limit → Notification[] (las de quien pregunta). Lane 276 (D11).
import { NextRequest } from "next/server";
import { paginacion, responder } from "@/lib/social/servidor/http";
import { listarNotificaciones } from "@/lib/social/servidor/notificaciones";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { skip, limit } = paginacion(req.nextUrl.searchParams);
  return responder((actor) => listarNotificaciones(actor, skip, limit));
}
