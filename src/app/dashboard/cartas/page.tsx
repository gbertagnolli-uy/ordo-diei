export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listarCartasUsuario } from "@/lib/cartas/server";
import { ColeccionView } from "@/components/cartas/ColeccionView";

export default async function CartasPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }

  const usuarioId = Number(session.user.id);
  const resultado = await listarCartasUsuario(usuarioId);

  return <ColeccionView inicial={resultado} rolFamiliar={session.user.rolFamiliar} />;
}
