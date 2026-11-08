export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { PageHeader } from "@/components/app/PageHeader";
import { PanelRutina } from "@/components/admin/PanelRutina";

export default async function AdminRutinaPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard");

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" groupHref="/dashboard/admin" title="Rutina familiar" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <PanelRutina />
      </main>
    </div>
  );
}