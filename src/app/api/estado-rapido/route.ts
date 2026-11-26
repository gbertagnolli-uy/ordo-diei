import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { contadoresRecompensasLayout } from "@/lib/recompensas/server";
import { contarComprasCompartidasPendientes } from "@/lib/tienda/server";

export const dynamic = "force-dynamic";

/** Contadores livianos para detectar cambios sin disparar `router.refresh()` en vano. */
export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const usuarioId = Number(session.user.id);
  const [recompensas, tiendaCompartidasPendientes] = await Promise.all([
    contadoresRecompensasLayout(usuarioId, session.user.rolFamiliar),
    contarComprasCompartidasPendientes(usuarioId).catch(() => 0),
  ]);

  return NextResponse.json(
    {
      premiosPendientes: recompensas.premiosPendientes,
      sorpresas: recompensas.sorpresas,
      reconocimientos: recompensas.reconocimientos,
      tiendaCompartidasPendientes,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
