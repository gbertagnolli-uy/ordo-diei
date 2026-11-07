// GET ?channel_id → ChannelMember[] · POST / DELETE ?channel_id&user_id → { message } (padres). Lane 276.
import { NextRequest } from "next/server";
import { responder } from "@/lib/social/servidor/http";
import { cambiarMiembro, listarMiembros } from "@/lib/social/servidor/canales";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const canalId = req.nextUrl.searchParams.get("channel_id") ?? "";
  return responder((actor) => listarMiembros(actor, canalId));
}

export async function POST(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return responder((actor) => cambiarMiembro(actor, sp.get("channel_id") ?? "", Number(sp.get("user_id")), true), 201);
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return responder((actor) => cambiarMiembro(actor, sp.get("channel_id") ?? "", Number(sp.get("user_id")), false));
}
