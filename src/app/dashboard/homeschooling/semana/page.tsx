export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { esPadre } from "@/lib/habitos/permisos";
import { esFechaValida, lunesDe } from "@/lib/homeschooling/semana";
import { hojaSemana } from "@/lib/homeschooling/servidor/semana";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import HojaSemanal from "@/components/homeschooling/plan/HojaSemanal";

// La semana de un hijo, lista para imprimir (padres)
export default async function SemanaPage({ searchParams }: { searchParams: Promise<{ alumno?: string; desde?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling");

  const alumnos = await alumnosDeFamilia();
  if (alumnos.length === 0) redirect("/dashboard/homeschooling");
  const q = await searchParams;
  const alumnoId = alumnos.find((a) => a.id === Number(q.alumno))?.id ?? alumnos[0].id;
  const hoy = hoyEnFamilia();
  const lunes = lunesDe(q.desde && esFechaValida(q.desde) ? q.desde : hoy);
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar) };
  const hoja = await hojaSemana(actor, alumnoId, lunes);
  return <HojaSemanal hoja={hoja} alumnos={alumnos.map((a) => ({ id: a.id, nombre: a.nombre }))} hoy={hoy} />;
}
