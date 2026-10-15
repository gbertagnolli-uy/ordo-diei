export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listaDeMemoria } from "@/lib/homeschooling/servidor/memoria";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import ListaMemoria from "@/components/homeschooling/memoria/ListaMemoria";

// Memoria: oraciones y listas de la fe para aprender de memoria (el hijo ve las suyas; un padre elige de qué hijo)
export default async function MemoriaPage({ searchParams }: { searchParams: Promise<{ alumno?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
  const padre = esPadre(actor.rol);
  const alumnos = padre ? await alumnosDeFamilia() : [];
  if (padre && alumnos.length === 0) redirect("/dashboard/homeschooling");
  const pedido = Number((await searchParams).alumno);
  const alumnoId = padre ? (alumnos.find((a) => a.id === pedido)?.id ?? alumnos[0].id) : actor.id;
  const datos = await listaDeMemoria(actor, alumnoId);
  return <ListaMemoria datos={datos} alumnos={alumnos.map((a) => ({ id: a.id, nombre: a.nombre }))} esPadre={padre} />;
}
