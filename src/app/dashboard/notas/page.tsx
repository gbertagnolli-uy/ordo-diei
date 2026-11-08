import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { NotasCliente } from "./NotasCliente";

export const dynamic = "force-dynamic";

// Bloc de notas personal (lane 271): cada usuario ve solo sus páginas.
export default async function NotasPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  return <NotasCliente usuarioId={String(session.user.id)} />;
}
