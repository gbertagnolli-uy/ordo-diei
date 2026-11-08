// GET /api/diario/recuerdos?tipo=&activos=anios,seis,uno,semana,bueno,azar&sinMalos=1&fecha=YYYY-MM-DD&bueno=<id>&azar=<id> → { hoy, grupos, elegidos } (lane 289)
// `fecha`, `bueno` y `azar` son lo que se eligió antes hoy (lo guarda el navegador), para que el buen día y el día aleatorio no cambien en todo el día.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado, tipoDe } from "@/lib/diario/api";
import { CLAVES_RECUERDO, type ClaveRecuerdo, type EleccionesDelDia } from "@/lib/diario/recuerdos";
import { recuerdosDelDia } from "@/lib/diario/servidor-linea";

export const dynamic = "force-dynamic";

const idOpcional = (v: string | null) => {
  const n = Number(v);
  return v !== null && Number.isInteger(n) && n > 0 ? n : null;
};

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const p = req.nextUrl.searchParams;
  const tipo = tipoDe(p.get("tipo"));
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  const pedidos = new Set((p.get("activos") ?? "").split(",").filter(Boolean));
  const activos = Object.fromEntries(CLAVES_RECUERDO.map((c) => [c, pedidos.has(c)])) as Record<ClaveRecuerdo, boolean>;
  const fecha = p.get("fecha");
  const fijos: EleccionesDelDia | null = fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? { fecha, bueno: idOpcional(p.get("bueno")), azar: idOpcional(p.get("azar")) } : null;
  try {
    return NextResponse.json(await recuerdosDelDia(actor, tipo, { activos, sinMalos: p.get("sinMalos") === "1" }, fijos));
  } catch (e) {
    return fallo(e);
  }
}
