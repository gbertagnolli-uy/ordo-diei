export const dynamic = "force-dynamic";

// Diario personal (lane 272): solo lo ve quien lo escribe.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { esPadre } from "@/lib/habitos/permisos";
import { PageHeader } from "@/components/app/PageHeader";
import { DiarioVista } from "@/components/diario/DiarioVista";

export default async function DiarioPersonalPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  return (
    <div className="flex flex-col">
      <PageHeader title="Mi diario" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 pb-36 sm:pb-24">
        <DiarioVista tipo="personal" hoy={hoyEnFamilia()} usuarioId={Number(session.user.id)} esPadre={esPadre(session.user.rolFamiliar)} />
      </main>
    </div>
  );
}
