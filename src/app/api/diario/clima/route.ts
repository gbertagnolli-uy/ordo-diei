// GET ?latitud=&longitud= → { clima } con el clima de ahora en ese punto (lane 296), o { clima: null } si el servicio no responde.
import { NextRequest, NextResponse } from "next/server";
import { actorDeSesion, fallo, noAutorizado } from "@/lib/diario/api";
import { climaActual } from "@/lib/diario/servidor-clima";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return noAutorizado();
  const p = req.nextUrl.searchParams;
  try {
    return NextResponse.json({ clima: await climaActual(p.get("latitud"), p.get("longitud")) });
  } catch (e) {
    return fallo(e);
  }
}
