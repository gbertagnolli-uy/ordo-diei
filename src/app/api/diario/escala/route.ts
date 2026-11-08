// GET ?tipo= → { escala } · PUT { tipo, niveles } → { escala } · DELETE ?tipo= → { escala } (vuelve a la predeterminada) — lane 286.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { guardarEscala, leerEscala, restablecerEscala } from "@/lib/diario/servidor-escala";

export const dynamic = "force-dynamic";

const invalido = () => NextResponse.json({ error: "Tipo inválido" }, { status: 400 });

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo) return invalido();
  try {
    return NextResponse.json({ escala: await leerEscala(actor, tipo) });
  } catch (e) {
    return fallo(e);
  }
}

export async function PUT(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if (!tipo) return invalido();
  try {
    return NextResponse.json({ escala: await guardarEscala(actor, tipo, body) });
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  if (!tipo) return invalido();
  try {
    return NextResponse.json({ escala: await restablecerEscala(actor, tipo) });
  } catch (e) {
    return fallo(e);
  }
}
