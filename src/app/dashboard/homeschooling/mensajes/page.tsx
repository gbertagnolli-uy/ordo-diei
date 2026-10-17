export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { conversaciones } from "@/lib/homeschooling/servidor/mensajes";
import Mensajeria from "@/components/homeschooling/mensajes/Mensajeria";

// Mensajes directos entre los integrantes de la familia
export default async function MensajesPage({ searchParams }: { searchParams: Promise<{ con?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
  const { personas } = await conversaciones(actor);
  const pedido = Number((await searchParams).con);
  return <Mensajeria personas={personas} conInicial={personas.some((p) => p.id === pedido) ? pedido : null} />;
}
