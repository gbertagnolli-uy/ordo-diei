// GET ?skip&limit&query → User[] (la familia; para las menciones). Lane 276 (D11).
import { NextRequest } from "next/server";
import { paginacion, responder } from "@/lib/social/servidor/http";
import { listarUsuarios } from "@/lib/social/servidor/usuarios";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { skip, limit } = paginacion(sp);
  return responder(() => listarUsuarios(skip, limit, sp.get("query") ?? undefined));
}
