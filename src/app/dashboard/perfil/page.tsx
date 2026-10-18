import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/app/PageHeader";
import { usuariosObjetivo } from "@/lib/habitos/permisos";
import { hoyDia, resumenConducta } from "@/lib/conducta/server";
import { getEstadoHabitos } from "@/lib/habitos/server";
import { infoRankingDeUsuario, resumenRachaAppDe } from "@/lib/engagement/servidor";
import { PerfilView, type PremioItem } from "@/components/perfil/PerfilView";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ usuarioId?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const sp = await searchParams;
  const pedidoId = sp?.usuarioId ? Number(sp.usuarioId) : undefined;

  let targetUserId = Number(session.user.id);

  if (pedidoId && Number.isInteger(pedidoId) && pedidoId !== targetUserId) {
    const permitidos = await usuariosObjetivo(session, [pedidoId]);
    if (!permitidos) {
      // Un hijo pidiendo otro id ve el suyo propio redirigiéndose
      redirect("/dashboard/perfil");
    }
    targetUserId = permitidos[0];
  }

  const [targetUser, estadoUsuario, premiosRaw, animoRaw, conducta, rachaApp, infoRanking] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: targetUserId },
      omit: { pinSecretoHash: true },
    }),
    getEstadoHabitos(targetUserId),
    prisma.premioEntregado.findMany({
      where: { usuarioId: targetUserId },
      include: {
        premio: {
          select: {
            id: true,
            titulo: true,
            cantidad: true,
          },
        },
      },
      orderBy: { fechaEntrega: "desc" },
    }),
    prisma.registroAnimo.findMany({
      where: { usuarioId: targetUserId, creadoEn: { gte: new Date(Date.now() - 91 * 86_400_000) } },
      select: { creadoEn: true, puntaje: true },
      orderBy: { creadoEn: "asc" },
    }),
    resumenConducta(targetUserId, 30),
    resumenRachaAppDe(targetUserId).catch(() => null),
    infoRankingDeUsuario(targetUserId).catch(() => null),
  ]);

  if (!targetUser) notFound();

  const esPropio = targetUser.id === Number(session.user.id);
  const titulo = esPropio ? "Mi perfil" : `Perfil de ${targetUser.nombre}`;

  const premios: PremioItem[] = premiosRaw.map((p) => ({
    id: p.id,
    estado: p.estado,
    fechaEntrega: p.fechaEntrega.toISOString(),
    premio: p.premio,
  }));

  return (
    <div className="flex flex-col">
      <PageHeader group="Cuenta" title={titulo} />
      <main className="flex-1">
        <PerfilView
          usuario={{ ...targetUser, rachaApp, ...(infoRanking ?? {}) }}
          habitos={estadoUsuario.habitos}
          premios={premios}
          animo={animoRaw.map((a) => ({ creadoEn: a.creadoEn.toISOString(), puntaje: a.puntaje }))}
          conducta={conducta}
          hoy={hoyDia()}
          esPropio={esPropio}
        />
      </main>
    </div>
  );
}
