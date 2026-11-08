import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/app/PageHeader";
import { usuariosObjetivo } from "@/lib/habitos/permisos";
import { getEstadoHabitos } from "@/lib/habitos/server";
import { listarCartasUsuario } from "@/lib/cartas/server";
import { LogrosView } from "@/components/logros/LogrosView";

export const dynamic = "force-dynamic";

// Logros (lane 275): mismas reglas de acceso que el perfil — un padre ve los de un hijo, un hijo solo los suyos.
export default async function LogrosPage({ searchParams }: { searchParams: Promise<{ usuarioId?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const sp = await searchParams;
  const pedidoId = sp?.usuarioId ? Number(sp.usuarioId) : undefined;
  let targetUserId = Number(session.user.id);
  if (pedidoId && Number.isInteger(pedidoId) && pedidoId !== targetUserId) {
    const permitidos = await usuariosObjetivo(session, [pedidoId]);
    if (!permitidos) redirect("/dashboard/logros");
    targetUserId = permitidos[0];
  }

  const [usuario, estado, cartas] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: targetUserId }, omit: { pinSecretoHash: true } }),
    getEstadoHabitos(targetUserId),
    listarCartasUsuario(targetUserId).catch(() => null),
  ]);
  if (!usuario) notFound();

  const esPropio = usuario.id === Number(session.user.id);
  return (
    <div className="flex flex-col">
      <PageHeader group="Cuenta" title={esPropio ? "Mis logros" : `Logros de ${usuario.nombre}`} />
      <LogrosView
        datos={{
          usuario,
          habitos: estado.habitos,
          cartas: (cartas?.cartas ?? []).map((c) => ({ desbloqueada: c.desbloqueada, rareza: c.rareza, grado: c.grado })),
        }}
      />
    </div>
  );
}
