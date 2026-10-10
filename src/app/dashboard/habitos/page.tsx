export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { esPadre } from "@/lib/habitos/permisos";
import { getCatalogo, getEstadoHabitos, getEstadosHabitos } from "@/lib/habitos/server";
import { HabitosView } from "@/components/habitos/HabitosView";

export default async function HabitosPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const yo = Number(session.user.id);
  const padre = esPadre(session.user.rolFamiliar);

  const miembros = padre
    ? await prisma.usuario.findMany({
        select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true },
        orderBy: { id: "asc" },
      })
    : [];

  const [catalogo, estados] = await Promise.all([
    getCatalogo(yo),
    padre ? getEstadosHabitos(miembros.map((m) => m.id)) : Promise.all([getEstadoHabitos(yo)]),
  ]);

  const propio = estados.find((e) => e.usuarioId === yo) ?? (await getEstadoHabitos(yo));

  return (
    <HabitosView
      inicial={propio}
      catalogo={catalogo}
      estados={estados}
      miembros={miembros}
      esPadre={padre}
      usuarioActualId={yo}
    />
  );
}
