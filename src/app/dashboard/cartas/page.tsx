export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listarCartasUsuario } from "@/lib/cartas/server";
import prisma from "@/lib/prisma";
import { haySancion } from "@/lib/comportamiento/sancionServer";
import { BloqueoPorSancion } from "@/components/comportamiento/BloqueoPorSancion";
import { ColeccionView } from "@/components/cartas/ColeccionView";

export default async function CartasPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }

  // La pestaña «Tienda» ya no existe: los enlaces viejos van a la Tienda
  if ((await searchParams).tab === "tienda") redirect("/dashboard/tienda");

  const usuarioId = Number(session.user.id);
  // Día con sanción: las cartas quedan deshabilitadas hasta mañana
  if (await haySancion(prisma, usuarioId)) return <BloqueoPorSancion que="cartas" />;
  const resultado = await listarCartasUsuario(usuarioId);

  return <ColeccionView inicial={resultado} rolFamiliar={session.user.rolFamiliar} />;
}
