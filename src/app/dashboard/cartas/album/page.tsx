export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listarCartasUsuario } from "@/lib/cartas/server";
import { AlbumDomoView } from "@/components/cartas/AlbumDomoView";

export default async function AlbumDomoPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }

  const { cartas } = await listarCartasUsuario(Number(session.user.id));

  return <AlbumDomoView cartas={cartas} />;
}
