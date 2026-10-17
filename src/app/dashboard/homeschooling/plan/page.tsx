export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { alumnosDeFamilia, diasDelAlumno, noLectivosDelAlumno } from "@/lib/homeschooling/servidor/vistas";
import { listarActividades } from "@/lib/homeschooling/servidor/actividades";
import { festividadesAlrededor } from "@/lib/homeschooling/servidor/festividades";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { tokenDeCalendario } from "@/lib/homeschooling/servidor/calendario";
import PlanCalendario from "@/components/homeschooling/plan/PlanCalendario";

// Calendario del plan de cada hijo (arrastrar un día pendiente lo mueve)
export default async function PlanPage({ searchParams }: { searchParams: Promise<{ alumno?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling");

  const alumnos = await alumnosDeFamilia();
  if (alumnos.length === 0) redirect("/dashboard/homeschooling");
  const q = (await searchParams).alumno;
  const todos = q === "todos" && alumnos.length > 1;
  const alumnoId = todos ? 0 : (alumnos.find((a) => a.id === Number(q))?.id ?? alumnos[0].id);

  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar) };
  const [diasPorHijo, noLectivosPorHijo, todas, festividades] = await Promise.all([
    Promise.all((todos ? alumnos : alumnos.filter((a) => a.id === alumnoId)).map(async (a) => (await diasDelAlumno(a.id)).map((d) => ({ ...d, ...(todos ? { alumnoId: a.id, alumno: a.nombre } : {}) })))),
    Promise.all((todos ? alumnos : alumnos.filter((a) => a.id === alumnoId)).map((a) => noLectivosDelAlumno(a.id))),
    listarActividades(actor),
    festividadesAlrededor(hoyEnFamilia()),
  ]);
  const dias = diasPorHijo.flat();
  // En «Todos» un día sin clase de varios hijos se muestra una sola vez
  const noLectivos = todos ? [...new Map(noLectivosPorHijo.flat().map((n) => [`${n.fecha}|${n.motivo}`, n])).values()] : noLectivosPorHijo[0];
  const actividades = todas.filter((a) => todos || a.participantes.some((p) => p.id === alumnoId)).map((a) => ({ id: a.id, titulo: a.title, inicio: a.start_time, fin: a.end_time }));
  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl p-4 sm:p-6">
      <PlanCalendario dias={dias} noLectivos={noLectivos} actividades={actividades} alumnos={alumnos} alumnoId={alumnoId} festividades={festividades} rutaCalendario={todos ? undefined : `/api/homeschooling/calendario/${alumnoId}/${tokenDeCalendario(alumnoId)}.ics`} />
    </div>
  );
}
