export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { getSolicitudes } from "@/lib/habitos/aprobaciones";
import { contarComprasPorAprobar } from "@/lib/tienda/server";
import { PageHeader } from "@/components/app/PageHeader";
import { ParteDeHoy } from "@/components/engagement/ParteDeHoy";
import { MetaSemanal } from "@/components/engagement/MetaSemanal";
import { parteDeHoy } from "@/lib/engagement/servidor";
import { metaDeLaSemana } from "@/lib/engagement/metaServidor";
import { PanelAdmin } from "@/components/admin/PanelAdmin";

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard");

  const yo = { id: Number(session.user.id), rol: session.user.rolFamiliar };
  const [solicitudes, premiosPorEntregar, comprasPorAprobar, parte, meta] = await Promise.all([
    getSolicitudes(),
    prisma.recompensa.count({ where: { estado: "reclamado" } }),
    contarComprasPorAprobar(session.user.rolFamiliar),
    parteDeHoy(yo).catch((e) => {
      console.error("[ParteDeHoy]", e);
      return null;
    }),
    metaDeLaSemana(yo).catch((e) => {
      console.error("[MetaSemanal]", e);
      return null;
    }),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" groupHref="/dashboard/admin" title="Panel de administración" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        {(parte || meta) && (
          <div className="mb-8 flex flex-col gap-4">
            {parte && <ParteDeHoy datos={parte} />}
            {meta && <MetaSemanal datos={meta} />}
          </div>
        )}
        <PanelAdmin pendientes={{ solicitudesHabitos: solicitudes.total, premiosPorEntregar, comprasPorAprobar }} />
      </main>
    </div>
  );
}
