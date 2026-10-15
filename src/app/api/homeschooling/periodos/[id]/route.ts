import { NextRequest } from "next/server";
import { conSesion } from "@/lib/tienda/http";
import { borrarPeriodo } from "@/lib/homeschooling/servidor/boletin";
import { idDe } from "../../_comun";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return conSesion(async (s) => {
    await borrarPeriodo(s, await idDe(params));
    return { ok: true };
  }, { soloPadres: true });
}
