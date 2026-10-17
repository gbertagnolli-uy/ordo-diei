export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PremiosClient } from "./PremiosClient";

export default async function PremiosPage() {
  const session = await getSession();
  if (!session || !session.user) redirect("/");
  
  if (session.user.rolFamiliar !== "Padre" && session.user.rolFamiliar !== "Madre") {
    redirect("/dashboard");
  }

  const premios = await prisma.premio.findMany({
    include: {
      entregas: {
        include: {
          usuario: {
            select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const tareas = await prisma.tarea.findMany({
    select: { id: true, titulo: true },
    orderBy: { titulo: "asc" }
  });

  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true }
  });

  const serialized = premios.map(p => ({
    ...p,
    createdAt: p.createdAt?.toISOString() || null,
    updatedAt: p.updatedAt?.toISOString() || null,
    entregas: p.entregas.map(e => ({
      ...e,
      fechaEntrega: e.fechaEntrega?.toISOString() || null,
    }))
  }));

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" groupHref="/dashboard/admin" title="Premios sorpresa" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        <PremiosClient 
          premios={serialized} 
          tareas={tareas}
          usuarios={usuarios}
        />
      </main>
    </div>
  );
}