export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TaskWorkspace } from "@/components/tasks/TaskWorkspace";
import { BannerEventosCartas } from "@/components/cartas/BannerEventosCartas";
import { MetaSemanal } from "@/components/engagement/MetaSemanal";
import { metaDeLaSemana } from "@/lib/engagement/metaServidor";
import { CompaneroCard } from "@/components/engagement/CompaneroCard";
import { companeroDe } from "@/lib/engagement/companeroServidor";
import { eventosDeHoy } from "@/lib/cartas/server";
import { haySancion } from "@/lib/comportamiento/sancionServer";
import { AvisosPush } from "@/components/engagement/AvisosPush";

const isParent = (role: string) => role === "Padre" || role === "Madre";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ s?: string; view?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const isCurrentUserAdmin = isParent(session.user.rolFamiliar);
  const sp = await searchParams;
  const vista = sp.s ?? sp.view;
  // Las tarjetas de engagement de los chicos van solo en la vista principal, no en Historial ni en las demás
  const enVistaPrincipal = !vista || vista === "todo";

  // Para no-admins, solo traer sus propias tareas (seguridad a nivel de query).
  const allUsersRaw = await prisma.usuario.findMany({
    omit: { pinSecretoHash: true },
    include: {
      tareasAsignadas: {
        where: isCurrentUserAdmin ? undefined : { asignadoId: session.user.id },
        include: { checklistItems: true },
      },
    },
  });

  // Fechas a string para los componentes cliente
  const allUsers = allUsersRaw.map((u) => ({
    ...u,
    fechaNacimiento: u.fechaNacimiento ? u.fechaNacimiento.toISOString() : null,
    tareasAsignadas: u.tareasAsignadas.map((t: any) => ({
      ...t,
      fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
      horaEjecucion: t.horaEjecucion ? t.horaEjecucion.toISOString() : null,
      timerStartedAt: t.timerStartedAt ? t.timerStartedAt.toISOString() : null,
    })),
  }));

  const parents = allUsers.filter((u) => isParent(u.rolFamiliar));
  const children = allUsers.filter((u) => !isParent(u.rolFamiliar)).sort((a, b) => {
    const diff1 = (b.completionPercentage || 0) - (a.completionPercentage || 0);
    if (diff1 !== 0) return diff1;
    const diff2 = (b.stars || 0) - (a.stars || 0);
    if (diff2 !== 0) return diff2;
    return (b.puntosAcumulados || 0) - (a.puntosAcumulados || 0);
  });

  // Meta semanal en familia (solo chicos acá; los padres la ven en el panel de administración)
  const meta = isCurrentUserAdmin || !enVistaPrincipal
    ? null
    : await metaDeLaSemana({ id: Number(session.user.id), rol: session.user.rolFamiliar }).catch((e) => {
        console.error("[MetaSemanal]", e);
        return null;
      });

  // Compañero «héroe»: es de todos (hijos y padres). Si hay cartas por reclamar, las señala
  const companero = !enVistaPrincipal
    ? null
    : await (async () => {
        const id = Number(session.user.id);
        const [cartas, sancionado] = await Promise.all([eventosDeHoy(id).catch(() => null), haySancion(prisma, id)]);
        return companeroDe(id, new Date(), { cartasNuevas: !!cartas?.hayPendientes, sancionado });
      })().catch((e) => {
        console.error("[Companero]", e);
        return null;
      });

  const myUser = allUsers.find((u) => u.id === session.user.id);
  const myTasks = myUser?.tareasAsignadas || [];

  // Co-responsables: otros usuarios con tareas del mismo grupoTareaId
  const coResponsableMap: Record<number, { id: number; nombre: string; fotoUrl: string | null }[]> = {};
  for (const task of myTasks.filter((t: any) => t.grupoTareaId)) {
    const siblings = allUsers
      .flatMap((u) => u.tareasAsignadas.map((t: any) => ({ ...t, usuario: { id: u.id, nombre: u.nombre, fotoUrl: u.fotoUrl } })))
      .filter((t: any) => t.grupoTareaId === (task as any).grupoTareaId && t.asignadoId !== session.user.id);
    coResponsableMap[task.id] = Array.from(new Map(siblings.map((s: any) => [s.usuario.id, s.usuario])).values()) as any;
  }

  return (
    <div className="flex flex-col w-full">
      <div className="px-4 sm:px-6 pt-3">
        <BannerEventosCartas />
      </div>
      <div className="px-4 sm:px-6 empty:hidden [&:has(*)]:pt-3">
        <AvisosPush modo="invitacion" />
      </div>
      {companero && (
        <div className="px-4 sm:px-6 pt-3">
          <CompaneroCard datos={companero} />
        </div>
      )}
      {meta?.meta && (
        <div className="px-4 sm:px-6 pt-3">
          <MetaSemanal datos={meta} />
        </div>
      )}
      <TaskWorkspace
        tasks={myTasks}
        coResponsables={coResponsableMap}
        isAdmin={isCurrentUserAdmin}
        family={{ parents, children }}
      />
    </div>
  );
}
