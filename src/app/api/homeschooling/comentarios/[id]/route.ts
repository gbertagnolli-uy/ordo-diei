import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { borrarComentario } from "@/lib/homeschooling/servidor/comentarios";
import { idDe } from "../../_comun";

export const dynamic = "force-dynamic";

// DELETE: borra el comentario (el autor o un padre)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return conSesion(async (s) => {
    await borrarComentario(s, await idDe(params));
    return { ok: true };
  });
}
