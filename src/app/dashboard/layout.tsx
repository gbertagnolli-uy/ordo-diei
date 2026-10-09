import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { TopBar } from "@/components/dashboard/TopBar";
import { MainDock } from "@/components/dashboard/MainDock";
import { ModalManager } from "@/components/dashboard/ModalManager";
import { NoticeBar } from "@/components/dashboard/NoticeBar";

export const dynamic = "force-dynamic";

// Chrome compartido por todas las páginas de /dashboard: TopBar arriba, Dock abajo.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  // Sin PIN_Secreto: estos datos viajan al cliente (ranking, dock, topbar)
  const users = await prisma.usuario.findMany({ omit: { pinSecretoHash: true } });
  const currentUser = users.find((u) => u.id === session.user.id) ?? session.user;

  return (
    <div className="min-h-screen bg-[var(--surface)] transition-colors">
      <TopBar currentUser={currentUser} />
      <ModalManager />
      <div className="pt-14 pb-28">
        <NoticeBar />
        {children}
      </div>
      <MainDock currentUser={currentUser} allUsers={users} />
    </div>
  );
}
