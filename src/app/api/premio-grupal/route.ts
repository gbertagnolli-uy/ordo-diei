import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { archivarPremioGrupal, crearPremioGrupal, listarPremiosGrupales, premioGrupalVigente } from "@/lib/engagement/premioGrupalServidor";

export const dynamic = "force-dynamic";

const fallo = (error: unknown, porDefecto: string) =>
  NextResponse.json(
    { error: error instanceof Error ? error.message : porDefecto },
    { status: (error as { status?: number }).status ?? 400 }
  );

// GET /api/premio-grupal — el vigente (todos); ?todos=1 — la lista completa (padres)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    if (req.nextUrl.searchParams.get("todos") === "1") {
      return NextResponse.json({ premios: await listarPremiosGrupales({ rol: session.user.rolFamiliar }) });
    }
    return NextResponse.json({ premio: await premioGrupalVigente() });
  } catch (error) {
    return fallo(error, "No se pudo leer el premio grupal");
  }
}

// POST — { titulo, descripcion?, porcentajeMeta, desde, hasta } (padres)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await crearPremioGrupal({ id: Number(session.user.id), rol: session.user.rolFamiliar }, await req.json().catch(() => ({})));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fallo(error, "No se pudo crear el premio grupal");
  }
}

// PATCH — { id } archiva (padres)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await req.json().catch(() => ({}));
    if (!Number.isInteger(Number(id))) return NextResponse.json({ error: "Falta el id" }, { status: 400 });
    await archivarPremioGrupal({ rol: session.user.rolFamiliar }, Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fallo(error, "No se pudo archivar");
  }
}
