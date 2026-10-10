import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/app/PageHeader";
import { usuariosObjetivo } from "@/lib/habitos/permisos";
import { getEstadoHabitos } from "@/lib/habitos/server";
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

  const [targetUser, estadoUsuario, premiosRaw] = await Promise.all([
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
          usuario={targetUser}
          habitos={estadoUsuario.habitos}
          premios={premios}
          esPropio={esPropio}
        />
      </main>
    </div>
  );
}
