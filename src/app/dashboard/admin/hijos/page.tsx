export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { hoyDia } from "@/lib/conducta/server";
import { resumenDeLosHijos } from "@/lib/conducta/resumenHijos";
import { PageHeader } from "@/components/app/PageHeader";
import { ResumenHijos } from "@/components/conducta/ResumenHijos";

export default async function HijosPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard");

  const hijos = await resumenDeLosHijos(session.user.rolFamiliar);

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" title="Resumen de los hijos" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <ResumenHijos hijos={hijos} hoy={hoyDia()} />
      </main>
    </div>
  );
}
