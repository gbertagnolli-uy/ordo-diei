import prisma from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { FamilyTree } from "@/components/dashboard/FamilyTree";
import { MyTasksBoard } from "@/components/dashboard/MyTasksBoard";
import { ModalManager } from "@/components/dashboard/ModalManager";
import { NoticeBar } from "@/components/dashboard/NoticeBar";
import { UserCalendarTable } from "@/components/dashboard/UserCalendarTable";
import { MoodSelector } from "@/components/dashboard/MoodSelector";
import { HistoryView } from "@/components/dashboard/HistoryView";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<any> }) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("session")?.value;

  if (!sessionValue) {
    redirect("/");
  }

  const session = await decrypt(sessionValue);
  const isCurrentUserAdmin = session.user.rolFamiliar === "Padre" || session.user.rolFamiliar === "Madre";

  const resolvedParams = await searchParams;
  const isHistoryView = resolvedParams.view === "history";

  // Recolectar usuarios. Para no-admins, solo traer sus propias tareas (seguridad a nivel de query).
  const allUsersRaw = isCurrentUserAdmin
    ? await prisma.usuario.findMany({
        include: { tareasAsignadas: { include: { checklistItems: true } } }
      })
    : await prisma.usuario.findMany({
        include: {
          tareasAsignadas: {
            where: { asignadoId: session.user.id },
            include: { checklistItems: true }
          }
        }
      });

  // Convertir Fechas a Strings para los Child Components
  const allUsers = allUsersRaw.map((u) => ({
    ...u,
    fechaNacimiento: u.fechaNacimiento ? u.fechaNacimiento.toISOString() : null,
    tareasAsignadas: u.tareasAsignadas.map((t: any) => ({
      ...t,
      fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
      horaEjecucion: t.horaEjecucion ? t.horaEjecucion.toISOString() : null,
      timerStartedAt: t.timerStartedAt ? t.timerStartedAt.toISOString() : null,
    }))
  }));

  // Dividir para el Árbol
  const isParent = (role: string) => role === "Padre" || role === "Madre";

  const parents = allUsers.filter(u => isParent(u.rolFamiliar));
  const children = allUsers.filter(u => !isParent(u.rolFamiliar)).sort((a, b) => {
    const diff1 = (b.completionPercentage || 0) - (a.completionPercentage || 0);
    if (diff1 !== 0) return diff1;
    const diff2 = (b.stars || 0) - (a.stars || 0);
    if (diff2 !== 0) return diff2;
    return (b.puntosAcumulados || 0) - (a.puntosAcumulados || 0);
  });


  const myUser = allUsers.find(u => u.id === session.user.id);
  const myTasks = myUser?.tareasAsignadas || [];

  // Build co-responsable map: for each task with a grupoTareaId, find other users assigned
  const coResponsableMap: Record<number, { id: number; nombre: string; fotoUrl: string | null }[]> = {};

  const groupedTasks = myTasks.filter((t: any) => t.grupoTareaId);
  for (const task of groupedTasks) {
    // Find all tasks with same grupoTareaId from all users
    const siblings = allUsers
      .flatMap(u => u.tareasAsignadas.map((t: any) => ({ ...t, usuario: { id: u.id, nombre: u.nombre, fotoUrl: u.fotoUrl } })))
      .filter((t: any) => t.grupoTareaId === (task as any).grupoTareaId && t.asignadoId !== session.user.id);

    const uniqueUsers = Array.from(new Map(siblings.map((s: any) => [s.usuario.id, s.usuario])).values());
    coResponsableMap[task.id] = uniqueUsers as any;
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] flex flex-col pt-20 transition-colors">
      <NoticeBar />
      <ModalManager />
      <Header currentUser={myUser} allUsers={allUsers as any} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8">

        {isHistoryView ? (
          <HistoryView />
        ) : (
          <>
            {/* Mis Tareas - Panel Gamificado */}
            <MyTasksBoard tasks={myTasks} coResponsables={coResponsableMap} />

            {/* Mood Tracker */}
            <div className="bg-[var(--surface-container-lowest)] rounded-md elevation-ambient p-6 mb-8 transition-colors">
              <MoodSelector 
                currentMood={myUser?.moodEmoji} 
                isOwnProfile={true} 
              />
            </div>

            {/* Vista de Calendario/Tabla para Hijos si no son admins */}
            {!isParent(session.user.rolFamiliar) && (
              <UserCalendarTable tasks={myTasks} />
            )}
          </>
        )}

        <div className="bg-[var(--surface-container-lowest)] rounded-md elevation-ambient p-8 sm:p-12 min-h-[600px] relative mt-16 transition-colors">
          <h2 className="font-display text-3xl text-[var(--on-surface)] mb-12 text-center">Jerarquía Familiar</h2>

          {/* Componente del Árbol Genealógico */}
          <FamilyTree parents={parents as any} children={children as any} />
        </div>
      </main>
    </div>
  );
}
