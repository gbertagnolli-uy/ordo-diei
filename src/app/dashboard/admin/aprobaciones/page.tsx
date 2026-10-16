export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SolicitudesHabitos } from "@/components/habitos/SolicitudesHabitos";
import { ParentReviewPanel } from "@/components/dashboard/ParentReviewPanel";
import { getSolicitudes } from "@/lib/habitos/aprobaciones";

export default async function AdminAprobacionesPage() {
  const session = await getSession();
  if (!session || !session.user) redirect("/");

  if (session.user.rolFamiliar !== "Padre" && session.user.rolFamiliar !== "Madre") {
    redirect("/dashboard");
  }

  const [tareas, solicitudes] = await Promise.all([
    prisma.tarea.findMany({
      include: { asignado: true, creador: true, checklistItems: { orderBy: { orden: "asc" } } },
      orderBy: { fechaVencimiento: "asc" },
    }),
    getSolicitudes(),
  ]);

  const tareasSerialized = tareas.map((t) => ({
    ...t,
    fechaVencimiento: t.fechaVencimiento?.toISOString() || null,
    horaEjecucion: t.horaEjecucion?.toISOString() || null,
  }));

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" groupHref="/dashboard/admin" title="Aprobaciones" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        <SolicitudesHabitos inicial={solicitudes} />
        <ParentReviewPanel tasks={tareasSerialized} />
      </main>
    </div>
  );
}
