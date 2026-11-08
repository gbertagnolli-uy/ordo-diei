import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/app/PageHeader";
import { PremioGrupalVista } from "@/components/engagement/PremioGrupalVista";
import { premioGrupalVigente } from "@/lib/engagement/premioGrupalServidor";

export const dynamic = "force-dynamic";

export default async function PremioGrupalPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const premio = await premioGrupalVigente();
  return (
    <div className="flex flex-col">
      <PageHeader title="Premio grupal" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <PremioGrupalVista premio={premio} />
      </main>
    </div>
  );
}
