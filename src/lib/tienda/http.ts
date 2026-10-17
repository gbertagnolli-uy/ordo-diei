// Envoltorio común de las rutas de la Tienda: sesión, errores con su estado y validaciones de zod
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession } from "../session";

export type SesionTienda = { id: number; rol: string };

export async function conSesion(
  fn: (s: SesionTienda) => Promise<unknown>,
  opciones: { soloPadres?: boolean } = {}
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const s = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
    if (opciones.soloPadres && s.rol !== "Padre" && s.rol !== "Madre") {
      return NextResponse.json({ error: "Solo un padre o una madre pueden hacer esto" }, { status: 403 });
    }
    return NextResponse.json(await fn(s));
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Datos no válidos" }, { status: 400 });
    }
    const status = (err as { status?: number }).status ?? 400;
    if (status >= 500) console.error("[API/Tienda]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status });
  }
}

export const entero = (x: unknown): number | null => {
  const n = Number(x);
  return Number.isInteger(n) && n > 0 ? n : null;
};
