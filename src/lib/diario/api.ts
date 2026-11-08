// Diario (lane 284): ayudas comunes de las rutas de /api/diario/catalogo.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import type { Actor } from "./etiquetas";
import type { TipoDiario } from "./reglas";

export const tipoDe = (v: unknown): TipoDiario | null => (v === "personal" || v === "familiar" ? v : null);

export const fallo = (e: unknown) => NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });

/** Quien hace el pedido, o null si no inició sesión. */
export async function actorDeSesion(): Promise<Actor | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
}

export const noAutorizado = () => NextResponse.json({ error: "No autorizado" }, { status: 401 });
