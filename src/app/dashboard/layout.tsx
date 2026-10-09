import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { MainDock } from "@/components/dashboard/MainDock";
import { ModalManager } from "@/components/dashboard/ModalManager";
import { NoticeBar } from "@/components/dashboard/NoticeBar";

export const dynamic = "force-dynamic";

// Chrome compartido por todas las páginas de /dashboard: barra lateral + Dock.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  // Sin PIN_Secreto: estos datos viajan al cliente (ranking, dock, menú de usuario)
  const [users, myTasks] = await Promise.all([
    prisma.usuario.findMany({ omit: { pinSecretoHash: true } }),
    // Solo lo necesario para los contadores de la barra lateral
    prisma.tarea.findMany({
      where: { asignadoId: session.user.id },
      select: { id: true, estado: true, timerStartedAt: true, fechaVencimiento: true, horaEjecucion: true },
    }),
  ]);
  const currentUser = users.find((u) => u.id === session.user.id) ?? session.user;
  const tasks = myTasks.map((t) => ({
    ...t,
    timerStartedAt: t.timerStartedAt?.toISOString() ?? null,
    fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
    horaEjecucion: t.horaEjecucion?.toISOString() ?? null,
  }));

  return (
    <SidebarProvider>
      <AppSidebar currentUser={currentUser} tasks={tasks} />
      <SidebarInset className="min-w-0">
        <NoticeBar />
        <div className="flex flex-1 flex-col pb-24">{children}</div>
      </SidebarInset>
      <ModalManager />
      <MainDock currentUser={currentUser} allUsers={users} />
    </SidebarProvider>
  );
}
