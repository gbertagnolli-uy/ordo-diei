// Lane 276: lo común de las rutas /api/social/** (sesión, errores, paginación skip/limit de packages/core).
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/session";
import type { Actor } from "@/lib/social/permisos";

export async function actorDeSesion(): Promise<Actor | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return { id: Number(session.user.id), rol: session.user.rolFamiliar };
}

export function fallo(e: unknown) {
  const status = (e as { status?: number }).status;
  if (typeof status === "number") return NextResponse.json({ error: (e as Error).message }, { status });
  // Un id que no es uuid: con el adaptador de pg llega como P2007 («invalid input syntax for type uuid»;
  // sin adaptador sería P2023) → no existe.
  if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2007" || e.code === "P2023") && /uuid/i.test(e.message))
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  console.error("[social]", e);
  return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
}

/** Corre `fn` con el actor de la sesión y responde su resultado en JSON (sin envoltorio, D11). */
export async function responder(fn: (actor: Actor) => Promise<unknown>, status = 200) {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json(await fn(actor), { status });
  } catch (e) {
    return fallo(e);
  }
}

/** skip / limit como los manda packages/core (limit entre 1 y 100, por defecto 20). */
export function paginacion(sp: URLSearchParams) {
  const skip = Math.max(0, Math.trunc(Number(sp.get("skip") ?? 0)) || 0);
  const limit = Math.min(100, Math.max(1, Math.trunc(Number(sp.get("limit") ?? 20)) || 20));
  return { skip, limit };
}

export const cuerpo = async (req: Request): Promise<Record<string, unknown>> => {
  const b = await req.json().catch(() => ({}));
  return b && typeof b === "object" && !Array.isArray(b) ? b : {};
};
