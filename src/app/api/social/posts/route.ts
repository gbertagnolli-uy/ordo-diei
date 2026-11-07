// GET posts?skip&limit&user_id&post_type&parent_id&channel_slug → Post[] · POST { content, channel_id?, parent_id?, enlace_lms? } → Post
// Lane 276 (D11): contrato de vendor/opencircle/packages/core/src/services/routers/posts.
import { NextRequest } from "next/server";
import { cuerpo, paginacion, responder } from "@/lib/social/servidor/http";
import { crearPost, listarPosts } from "@/lib/social/servidor/posts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const usuario = sp.get("user_id");
  return responder((actor) =>
    listarPosts(actor, {
      ...paginacion(sp),
      userId: usuario ? Number(usuario) : undefined,
      postType: sp.get("post_type") ?? undefined,
      parentId: sp.get("parent_id") ?? undefined,
      channelSlug: sp.get("channel_slug") ?? undefined,
    }),
  );
}

export async function POST(req: NextRequest) {
  const b = await cuerpo(req);
  return responder((actor) => crearPost(actor, b), 201);
}
