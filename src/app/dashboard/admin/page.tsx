export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { getSolicitudes } from "@/lib/habitos/aprobaciones";
import { contarComprasPorAprobar } from "@/lib/tienda/server";
import { PageHeader } from "@/components/app/PageHeader";
import { PanelAdmin } from "@/components/admin/PanelAdmin";

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard");

  const [solicitudes, premiosPorEntregar, comprasPorAprobar] = await Promise.all([
    getSolicitudes(),
    prisma.recompensa.count({ where: { estado: "reclamado" } }),
    contarComprasPorAprobar(session.user.rolFamiliar),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" title="Panel de administración" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <PanelAdmin pendientes={{ solicitudesHabitos: solicitudes.total, premiosPorEntregar, comprasPorAprobar }} />
      </main>
    </div>
  );
}
