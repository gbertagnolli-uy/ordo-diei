export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
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
    <div className="min-h-screen bg-[var(--surface)] flex flex-col pt-20 transition-colors">
      <Header currentUser={session.user} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col">
        <h1 className="text-3xl font-display font-bold text-[var(--primary)] mb-8">Premios Sorpresa</h1>
        <PremiosClient 
          premios={serialized} 
          tareas={tareas}
          usuarios={usuarios}
        />
      </main>
    </div>
  );
}