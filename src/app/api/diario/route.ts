// GET ?tipo=personal|familiar&mes=YYYY-MM → { entradas } · POST { tipo, fecha?, titulo?, texto, animo?, fotos? } (lane 272)
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { crearEntrada, listarMes } from "@/lib/diario/servidor";

export const dynamic = "force-dynamic";

const tipoDe = (v: unknown) => (v === "personal" || v === "familiar" ? v : null);
const fallo = (e: unknown) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  const mes = req.nextUrl.searchParams.get("mes") ?? "";
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    const actor = { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
    return NextResponse.json({ entradas: await listarMes(actor, tipo, mes) });
  } catch (e) {
    return fallo(e);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    const actor = { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
    return NextResponse.json({ entrada: await crearEntrada(actor, tipo, body) });
  } catch (e) {
    return fallo(e);
  }
}
