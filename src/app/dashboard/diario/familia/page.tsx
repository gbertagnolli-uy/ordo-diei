export const dynamic = "force-dynamic";

// Diario familiar (lane 272): lo ve y escribe toda la familia.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { PageHeader } from "@/components/app/PageHeader";
import { DiarioVista } from "@/components/diario/DiarioVista";

export default async function DiarioFamiliarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  return (
    <div className="flex flex-col">
      <PageHeader title="Diario familiar" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 pb-36 sm:pb-24">
        <DiarioVista tipo="familiar" hoy={hoyEnFamilia()} />
      </main>
    </div>
  );
}
