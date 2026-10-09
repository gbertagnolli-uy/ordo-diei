export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TaskWorkspace } from "@/components/tasks/TaskWorkspace";

const isParent = (role: string) => role === "Padre" || role === "Madre";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const isCurrentUserAdmin = isParent(session.user.rolFamiliar);

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
    <TaskWorkspace
      tasks={myTasks}
      coResponsables={coResponsableMap}
      isAdmin={isCurrentUserAdmin}
      family={{ parents, children }}
    />
  );
}
