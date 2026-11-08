// POST { nombre, args } → { resultado } (lane 298). Ejecuta una herramienta del asistente sobre el diario PERSONAL de quien tiene la sesión (D2).
// El modelo no elige ámbito ni persona; la aprobación del usuario (modo de permisos) se resuelve en el navegador antes de llamar acá.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, noAutorizado } from "@/lib/diario/api";
import { esHerramienta } from "@/lib/diario/asistente/herramientas";
import { ejecutarHerramienta } from "@/lib/diario/asistente/servidor-herramientas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 600_000;

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const crudo = await req.text();
  if (crudo.length > MAX_BYTES) return NextResponse.json({ error: "Pedido demasiado grande" }, { status: 413 });
  let cuerpo: { nombre?: unknown; args?: unknown };
  try {
    cuerpo = JSON.parse(crudo);
  } catch {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  if (!esHerramienta(cuerpo.nombre)) return NextResponse.json({ error: "Herramienta desconocida" }, { status: 400 });
  const args = typeof cuerpo.args === "object" && cuerpo.args !== null && !Array.isArray(cuerpo.args) ? (cuerpo.args as Record<string, unknown>) : {};
  return NextResponse.json({ resultado: await ejecutarHerramienta(actor, cuerpo.nombre, args) });
}
