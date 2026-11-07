// POST { post_id, emoji } → Reaction | { message } (alterna) · DELETE ?post_id&emoji → { message }. Lane 276 (D11).
import { NextRequest } from "next/server";
import { cuerpo, responder } from "@/lib/social/servidor/http";
import { alternarReaccion, quitarReaccion } from "@/lib/social/servidor/reacciones";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await cuerpo(req);
  return responder((actor) => alternarReaccion(actor, b));
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return responder((actor) => quitarReaccion(actor, sp.get("post_id") ?? "", sp.get("emoji")));
}
