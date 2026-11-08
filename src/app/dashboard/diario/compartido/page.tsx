export const dynamic = "force-dynamic";

// Diario (lane 293): destino del «Compartir» de otras apps (`share_target` del manifiesto). Daily You `share_page.dart`: se elige el día y se agrega al diario.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { PageHeader } from "@/components/app/PageHeader";
import { CompartidoVista } from "@/components/diario/compartir/CompartidoVista";
import { leerCompartido } from "@/lib/diario/compartido";

type Parametros = { title?: string | string[]; text?: string | string[]; url?: string | string[] };
const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function DiarioCompartidoPage({ searchParams }: { searchParams: Promise<Parametros> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const p = await searchParams;
  const compartido = leerCompartido({ get: (n) => primero(p[n as keyof Parametros]) });
  return (
    <div className="flex flex-col">
      <PageHeader title="Agregar al diario" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 pb-36 sm:pb-24">
        <CompartidoVista compartido={compartido} hoy={hoyEnFamilia()} />
      </main>
    </div>
  );
}
