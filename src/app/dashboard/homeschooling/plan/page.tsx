export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { alumnosDeFamilia, diasDelAlumno, noLectivosDelAlumno } from "@/lib/homeschooling/servidor/vistas";
import { listarActividades } from "@/lib/homeschooling/servidor/actividades";
import PlanCalendario from "@/components/homeschooling/plan/PlanCalendario";

// Calendario del plan de cada hijo (arrastrar un día pendiente lo mueve)
export default async function PlanPage({ searchParams }: { searchParams: Promise<{ alumno?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling");

  const alumnos = await alumnosDeFamilia();
  if (alumnos.length === 0) redirect("/dashboard/homeschooling");
  const pedido = Number((await searchParams).alumno);
  const alumnoId = alumnos.find((a) => a.id === pedido)?.id ?? alumnos[0].id;

  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar) };
  const [dias, noLectivos, todas] = await Promise.all([diasDelAlumno(alumnoId), noLectivosDelAlumno(alumnoId), listarActividades(actor)]);
  const actividades = todas.filter((a) => a.participantes.some((p) => p.id === alumnoId)).map((a) => ({ id: a.id, titulo: a.title, inicio: a.start_time, fin: a.end_time }));
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl p-4 sm:p-6">
      <PlanCalendario dias={dias} noLectivos={noLectivos} actividades={actividades} alumnos={alumnos} alumnoId={alumnoId} />
    </div>
  );
}
