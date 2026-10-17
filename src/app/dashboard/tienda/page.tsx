export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { obtenerTienda } from "@/lib/tienda/server";
import prisma from "@/lib/prisma";
import { haySancion } from "@/lib/comportamiento/sancionServer";
import { BloqueoPorSancion } from "@/components/comportamiento/BloqueoPorSancion";
import { TiendaView } from "@/components/tienda/TiendaView";

// Tienda: todo lo que se puede canjear con puntos, estrellas e incienso (vault/nuevas-features/marketplace/SPEC.md)
export default async function TiendaPage({ searchParams }: { searchParams: Promise<{ producto?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const { producto } = await searchParams;
  // Día con sanción: la tienda queda deshabilitada hasta mañana
  if (await haySancion(prisma, Number(session.user.id))) return <BloqueoPorSancion que="tienda" />;
  const inicial = await obtenerTienda(Number(session.user.id));
  const id = Number(producto);
  return <TiendaView inicial={inicial} esPadre={esPadre(session.user.rolFamiliar)} productoInicial={Number.isInteger(id) && id > 0 ? id : null} />;
}
