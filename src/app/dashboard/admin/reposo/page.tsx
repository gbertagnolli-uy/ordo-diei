export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { PageHeader } from "@/components/app/PageHeader";
import { PanelReposo } from "@/components/admin/PanelReposo";

export default async function AdminReposoPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard");

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" title="Reposo" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <PanelReposo />
      </main>
    </div>
  );
}
