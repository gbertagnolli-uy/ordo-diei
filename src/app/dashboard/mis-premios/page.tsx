export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { getRecompensas } from "@/lib/recompensas/server";
import { PageHeader } from "@/components/app/PageHeader";
import { MisPremios } from "@/components/recompensas/MisPremios";

export default async function MisPremiosPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const inicial = await getRecompensas(Number(session.user.id), session.user.rolFamiliar);

  return (
    <div className="flex flex-col">
      <PageHeader group="Rutina" title="Mis premios" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <MisPremios inicial={inicial} esPadre={esPadre(session.user.rolFamiliar)} />
      </main>
    </div>
  );
}
