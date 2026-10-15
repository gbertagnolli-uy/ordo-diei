export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hojaDiaPorToken } from "@/lib/homeschooling/servidor/hojaDia";
import HojaDelDia from "@/components/homeschooling/material/HojaDelDia";

// La hoja del día lista para imprimir. El enlace se genera al apretar «Imprimir mi hoja» (cuenta una impresión) y vale 15 minutos.
export default async function HojaDiaPage({ params }: { params: Promise<{ token: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
  const { token } = await params;
  const hoja = await hojaDiaPorToken(actor, token).catch((e: unknown) => (e instanceof Error ? e : new Error("Error")));
  if (hoja instanceof Error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-md space-y-3 p-6 text-center">
        <p className="text-lg font-semibold text-foreground">No se puede mostrar esta hoja</p>
        <p className="text-sm text-muted-foreground">{hoja.message}</p>
        <Link href="/dashboard/homeschooling" className="text-sm font-medium text-primary underline underline-offset-2">
          Volver a Estudio
        </Link>
      </div>
    );
  }
  return <HojaDelDia hoja={hoja} />;
}
