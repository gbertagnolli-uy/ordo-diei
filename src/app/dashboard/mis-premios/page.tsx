export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { getRecompensas } from "@/lib/recompensas/server";
import { getCartasPorReclamar, getResumenDia } from "@/lib/recompensas/resumen";
import { PageHeader } from "@/components/app/PageHeader";
import { BannerEventosCartas } from "@/components/cartas/BannerEventosCartas";
import { CartasPorReclamar } from "@/components/recompensas/CartasPorReclamar";
import { MisPremios } from "@/components/recompensas/MisPremios";
import { ResumenDia } from "@/components/recompensas/ResumenDia";
import { AvisoMitadHoy } from "@/components/comportamiento/BloqueoPorSancion";

export default async function MisPremiosPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const usuarioId = Number(session.user.id);

  const [inicial, cartas, resumen] = await Promise.all([
    getRecompensas(usuarioId, session.user.rolFamiliar),
    getCartasPorReclamar(usuarioId),
    getResumenDia(usuarioId),
  ]);

  // Todo lo que el usuario tiene para reclamar, en un solo lugar: regalos de cartas (fiesta, cumpleaños,
  // bienvenida), grados alcanzados, cofres y premios; y al pie el resumen del día.
  return (
    <div className="flex flex-col">
      <PageHeader group="Rutina" title="Mis premios" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
        {inicial.sancionado && <AvisoMitadHoy />}
        {!inicial.sancionado && <BannerEventosCartas />}
        <CartasPorReclamar cartas={inicial.sancionado ? [] : cartas} />
        <MisPremios inicial={inicial} esPadre={esPadre(session.user.rolFamiliar)} />
        <ResumenDia resumen={resumen} />
      </main>
    </div>
  );
}
