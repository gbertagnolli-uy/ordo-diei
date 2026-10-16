export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { hoyDia, resumenConducta } from "@/lib/conducta/server";
import { PageHeader } from "@/components/app/PageHeader";
import { RegistroConducta } from "@/components/conducta/RegistroConducta";

export default async function ConductaPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard");

  const hijos = await prisma.usuario.findMany({
    where: { rolFamiliar: { in: ["Hijo", "Hija"] } },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
  const resumenes = await Promise.all(hijos.map((h) => resumenConducta(h.id, 14)));
  const recientes = Object.fromEntries(hijos.map((h, i) => [h.id, resumenes[i].registros]));

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" title="Registrar conducta" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <RegistroConducta hijos={hijos} hoy={hoyDia()} recientes={recientes} />
      </main>
    </div>
  );
}
