export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { colaDeHoy } from "@/lib/homeschooling/servidor/memoria";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import Recitado from "@/components/homeschooling/memoria/Recitado";

// Sesión de recitado: la conduce un padre (solo padres)
export default async function RecitarPage({ searchParams }: { searchParams: Promise<{ alumno?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling/memoria");
  const alumnos = await alumnosDeFamilia();
  const pedido = Number((await searchParams).alumno);
  const alumno = alumnos.find((a) => a.id === pedido) ?? alumnos[0];
  if (!alumno) redirect("/dashboard/homeschooling");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar) };
  const cola = await colaDeHoy(actor, alumno.id);
  return <Recitado cola={cola} alumno={{ id: alumno.id, nombre: alumno.nombre }} />;
}
