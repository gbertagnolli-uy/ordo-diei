export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/app/PageHeader";
import { OracionClient } from "@/components/oracion/OracionClient";
import { getEstadoOracion, hoyEnFamilia } from "@/lib/oracion/server";
import { misteriosDelDia } from "@/lib/oracion/catalogo";

export default async function OracionPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const estado = await getEstadoOracion(Number(session.user.id));
  const { serie } = misteriosDelDia(hoyEnFamilia());

  return (
    <div className="flex flex-col">
      <PageHeader group="Vida espiritual" title="Oración" subtitle={`Hoy, misterios ${serie.toLowerCase()}`} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        <OracionClient inicial={estado} />
      </main>
    </div>
  );
}
