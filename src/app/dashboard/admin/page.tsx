import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AdminTasksClient } from "./AdminTasksClient";
import { Header } from "@/components/dashboard/Header";

export default async function AdminTasksPage() {
  const session = await getSession();
  if (!session || !session.user) redirect("/");
  
  if (session.user.rolFamiliar !== "Padre" && session.user.rolFamiliar !== "Madre") {
    redirect("/dashboard");
  }

  const tareas = await prisma.tarea.findMany({
    include: { asignado: true, creador: true },
    orderBy: { fechaVencimiento: 'asc' }
  });

  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true }
  });

  // Serialize dates
  const tareasSerialized = tareas.map(t => ({
     ...t,
     fechaVencimiento: t.fechaVencimiento?.toISOString() || null,
     horaEjecucion: t.horaEjecucion?.toISOString() || null,
  }));

  return (
    <div className="min-h-screen bg-[var(--surface)] flex flex-col pt-20 transition-colors">
      <Header currentUser={session.user} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col">
        <h1 className="text-3xl font-display font-bold text-[var(--primary)] mb-8">Administración Global de Tareas</h1>
        <AdminTasksClient tasks={tareasSerialized} users={usuarios} />
      </main>
    </div>
  );
}
