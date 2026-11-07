// POST { id, data, baseRev, purged } → { ok, rev, data?, purged?, tooBig? } (lane 271; protocolo de dovli)
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pushNota } from "@/lib/notas/servidor/nube";
import { MAX_PAGE_CHARS } from "@/lib/notas/servidor/reglas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Iniciá sesión para sincronizar" }, { status: 401 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_PAGE_CHARS + 20_000) return NextResponse.json({ ok: false, rev: 0, tooBig: true });
  try {
    return NextResponse.json(await pushNota(Number(session.user.id), await req.json().catch(() => null)));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudo guardar" }, { status: 400 });
  }
}
