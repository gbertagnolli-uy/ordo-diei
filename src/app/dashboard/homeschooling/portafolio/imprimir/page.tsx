export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { filtrarPorFechas } from "@/lib/homeschooling/portafolioImpreso";
import { listarMaterias } from "@/lib/homeschooling/servidor/cursos";
import { listarEvidencias } from "@/lib/homeschooling/servidor/evidencia";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import PortafolioImprimible from "@/components/homeschooling/portafolio/PortafolioImprimible";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Portafolio imprimible de un hijo (solo padres): trabajos aprobados, por rango de fechas y materia
export default async function PortafolioImprimiblePage({ searchParams }: { searchParams: Promise<{ alumno?: string; materia?: string; desde?: string; hasta?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling/portafolio");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar) };

  const alumnos = await alumnosDeFamilia();
  if (alumnos.length === 0) redirect("/dashboard/homeschooling");
  const q = await searchParams;
  const alumno = alumnos.find((a) => a.id === Number(q.alumno)) ?? alumnos[0];
  const materiaId = Number(q.materia) || null;
  const desde = q.desde && FECHA.test(q.desde) ? q.desde : null;
  const hasta = q.hasta && FECHA.test(q.hasta) ? q.hasta : null;

  const [todas, materias] = await Promise.all([listarEvidencias(actor, { alumnoId: alumno.id, materiaId, estado: "aprobada" }), listarMaterias(actor)]);
  return <PortafolioImprimible evidencias={filtrarPorFechas(todas, desde, hasta)} alumno={alumno.nombre} desde={desde} hasta={hasta} materia={materias.find((m) => m.id === materiaId)?.name ?? null} />;
}
