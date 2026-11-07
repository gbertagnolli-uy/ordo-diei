// GET → Channel · PUT { name?, description?, emoji?, type? } → Channel · DELETE → { message } (padres). Lane 276.
import { NextRequest } from "next/server";
import { cuerpo, responder } from "@/lib/social/servidor/http";
import { borrarCanal, canalVisible, editarCanal } from "@/lib/social/servidor/canales";
import { aCanalDTO } from "@/lib/social/servidor/dto";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return responder(async (actor) => aCanalDTO(await canalVisible({ id }, actor)));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const b = await cuerpo(req);
  return responder((actor) => editarCanal(actor, id, b));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return responder((actor) => borrarCanal(actor, id));
}
