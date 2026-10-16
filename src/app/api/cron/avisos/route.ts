import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rangoDelDia } from "@/lib/comportamiento/sancionServer";
import { hoyDia } from "@/lib/conducta/server";
import { otorgarCofreDelDia } from "@/lib/comportamiento/server";
import { avisoCofre, avisoRegistrarDia } from "@/lib/push/avisos";
import { enviarAviso, pushConfigurado } from "@/lib/push/servidor";

export const dynamic = "force-dynamic";

// GET /api/cron/avisos — todos los días a las 18:00 (hora de la familia): el cofre llega a los chicos que se portaron
// bien y se avisa a los padres de quién falta registrar. Exige CRON_SECRET (Vercel lo manda como «Bearer»).
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!pushConfigurado()) return NextResponse.json({ ok: true, omitido: "Sin claves VAPID" });

  const ahora = new Date();
  const { desde, hasta } = rangoDelDia(ahora);
  const usuarios = await prisma.usuario.findMany({
    where: { suscripcionesPush: { some: {} } },
    select: { id: true, nombre: true, rolFamiliar: true },
  });

  let cofres = 0;
  let recordatorios = 0;
  for (const u of usuarios.filter((x) => x.rolFamiliar === "Hijo" || x.rolFamiliar === "Hija")) {
    try {
      // Si todavía no le había llegado, se le entrega ahora y recién ahí se le avisa
      if (await otorgarCofreDelDia(u.id, ahora)) cofres += await enviarAviso(u.id, avisoCofre(), { ahora });
    } catch (e) {
      console.error("[Cron Avisos] cofre", u.id, e);
    }
  }

  const padres = usuarios.filter((x) => x.rolFamiliar === "Padre" || x.rolFamiliar === "Madre");
  if (padres.length > 0) {
    const [hijos, registros, conductas] = await Promise.all([
      prisma.usuario.findMany({ where: { rolFamiliar: { in: ["Hijo", "Hija"] } }, select: { id: true, nombre: true }, orderBy: { id: "asc" } }),
      prisma.comportamiento.findMany({ where: { createdAt: { gte: desde, lt: hasta } }, select: { usuarioId: true }, distinct: ["usuarioId"] }),
      prisma.conductaDia.findMany({ where: { fecha: new Date(`${hoyDia(ahora)}T00:00:00Z`) }, select: { usuarioId: true } }),
    ]);
    const registrados = new Set([...registros, ...conductas].map((r) => r.usuarioId));
    const aviso = avisoRegistrarDia(hijos.filter((h) => !registrados.has(h.id)).map((h) => h.nombre));
    if (aviso) for (const p of padres) recordatorios += await enviarAviso(p.id, aviso, { ahora });
  }

  return NextResponse.json({ ok: true, cofres, recordatorios });
}
