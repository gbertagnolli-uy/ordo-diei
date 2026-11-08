// GET → Post · PUT { content?, is_pinned? } → Post · DELETE → { message }. Lane 276 (D6, D11).
import { NextRequest } from "next/server";
import { cuerpo, responder } from "@/lib/social/servidor/http";
import { borrarPost, editarPost, obtenerPost } from "@/lib/social/servidor/posts";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return responder((actor) => obtenerPost(actor, id));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const b = await cuerpo(req);
  return responder((actor) => editarPost(actor, id, b));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return responder((actor) => borrarPost(actor, id));
}
