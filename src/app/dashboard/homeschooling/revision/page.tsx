export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { estadisticasEvidencias, listarEvidencias } from "@/lib/homeschooling/servidor/evidencia";
import RevisionEvidencias from "@/components/homeschooling/revision/RevisionEvidencias";

// Bandeja de revisión de evidencias (solo padres)
export default async function RevisionPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar) };

  const pedido = (await searchParams).estado;
  const estado = pedido === "aprobada" || pedido === "ajustar" || pedido === "todas" ? pedido : "pendiente";
  const [evidencias, stats] = await Promise.all([listarEvidencias(actor, { estado: estado === "todas" ? undefined : estado }), estadisticasEvidencias(actor)]);
  return <RevisionEvidencias evidencias={evidencias} stats={stats} estado={estado} />;
}
