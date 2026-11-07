// GET → ReactionsByEmoji[]. Lane 276 (D11).
import { NextRequest } from "next/server";
import { responder } from "@/lib/social/servidor/http";
import { reaccionesDePost } from "@/lib/social/servidor/reacciones";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return responder((actor) => reaccionesDePost(actor, postId));
}
