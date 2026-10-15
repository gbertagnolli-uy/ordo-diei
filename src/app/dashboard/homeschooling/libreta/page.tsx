export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { libretaDe } from "@/lib/homeschooling/servidor/calificaciones";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import Libreta from "@/components/homeschooling/libreta/Libreta";

// Libreta de calificaciones de cada hijo (solo padres)
export default async function LibretaPage({ searchParams }: { searchParams: Promise<{ alumno?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling");

  const alumnos = await alumnosDeFamilia();
  if (alumnos.length === 0) redirect("/dashboard/homeschooling");
  const pedido = Number((await searchParams).alumno);
  const alumnoId = alumnos.find((a) => a.id === pedido)?.id ?? alumnos[0].id;
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar) };
  const libreta = await libretaDe(actor, alumnoId);
  return <Libreta libreta={libreta} alumnos={alumnos.map((a) => ({ id: a.id, nombre: a.nombre }))} />;
}
