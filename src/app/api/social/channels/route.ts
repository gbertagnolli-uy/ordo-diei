// GET ?skip&limit → Channel[] visibles · POST { name, slug?, description?, emoji?, type?, member_ids? } → Channel (padres). Lane 276.
import { NextRequest } from "next/server";
import { cuerpo, paginacion, responder } from "@/lib/social/servidor/http";
import { crearCanal, listarCanales } from "@/lib/social/servidor/canales";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { skip, limit } = paginacion(req.nextUrl.searchParams);
  return responder((actor) => listarCanales(actor, skip, limit));
}

export async function POST(req: NextRequest) {
  const b = await cuerpo(req);
  return responder((actor) => crearCanal(actor, b), 201);
}
