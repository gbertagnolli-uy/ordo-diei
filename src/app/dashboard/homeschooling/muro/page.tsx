export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { leerMuro } from "@/lib/homeschooling/servidor/muro";
import MuroFamilia from "@/components/homeschooling/muro/MuroFamilia";

// El muro de la familia: avisos de los padres y logros de los hijos (toda la familia)
export default async function MuroPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
  const muro = await leerMuro(actor);
  return <MuroFamilia muro={muro} esPadre={esPadre(actor.rol)} />;
}
