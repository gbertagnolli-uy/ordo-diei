export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AdminTasksClient } from "./AdminTasksClient";

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
    <div className="flex flex-col">
      <PageHeader group="Administración" title="Agenda master" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        <AdminTasksClient tasks={tareasSerialized} users={usuarios} />
      </main>
    </div>
  );
}
