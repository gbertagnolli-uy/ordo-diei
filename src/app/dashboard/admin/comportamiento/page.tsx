export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarComportamientos } from "@/lib/comportamiento/server";
import { PageHeader } from "@/components/app/PageHeader";
import { ComportamientoAdmin } from "@/components/comportamiento/ComportamientoAdmin";

export default async function ComportamientoPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard");

  const [inicial, usuarios, cartas] = await Promise.all([
    listarComportamientos(session.user.rolFamiliar),
    prisma.usuario.findMany({
      select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.carta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" groupHref="/dashboard/admin" title="Regalar premio" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <ComportamientoAdmin inicial={inicial} usuarios={usuarios} cartas={cartas} />
      </main>
    </div>
  );
}
