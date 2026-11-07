// GET → User (el username es el id de Ordo). Lane 276 (D11).
import { NextRequest } from "next/server";
import { responder } from "@/lib/social/servidor/http";
import { usuarioPorUsername } from "@/lib/social/servidor/usuarios";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return responder(() => usuarioPorUsername(username));
}
