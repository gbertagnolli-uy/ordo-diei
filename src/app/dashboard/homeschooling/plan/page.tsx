export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { alumnosDeFamilia, diasDelAlumno, noLectivosDelAlumno } from "@/lib/homeschooling/servidor/vistas";
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

  const [dias, noLectivos] = await Promise.all([diasDelAlumno(alumnoId), noLectivosDelAlumno(alumnoId)]);
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PlanCalendario dias={dias} noLectivos={noLectivos} alumnos={alumnos} alumnoId={alumnoId} />
    </div>
  );
}
