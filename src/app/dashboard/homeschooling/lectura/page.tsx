export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listaDeLectura } from "@/lib/homeschooling/servidor/lectura";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import ListaLectura from "@/components/homeschooling/lectura/ListaLectura";

// Lista de lectura: el hijo ve la suya; un padre elige de qué hijo
export default async function LecturaPage({ searchParams }: { searchParams: Promise<{ alumno?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
  const padre = esPadre(actor.rol);

  const alumnos = padre ? await alumnosDeFamilia() : [];
  if (padre && alumnos.length === 0) redirect("/dashboard/homeschooling");
  const pedido = Number((await searchParams).alumno);
  const alumnoId = padre ? (alumnos.find((a) => a.id === pedido)?.id ?? alumnos[0].id) : actor.id;
  const datos = await listaDeLectura(actor, alumnoId);
  return <ListaLectura datos={datos} alumnos={alumnos.map((a) => ({ id: a.id, nombre: a.nombre }))} esPadre={padre} />;
}
