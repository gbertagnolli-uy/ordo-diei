export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { periodoDe } from "@/lib/homeschooling/horas";
import { listarMaterias } from "@/lib/homeschooling/servidor/cursos";
import { resumenHoras } from "@/lib/homeschooling/servidor/horas";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import Reporte from "@/components/homeschooling/reportes/Reporte";

// Reporte imprimible de un alumno: año escolar, trimestre o mes
export default async function ReportesPage({ searchParams }: { searchParams: Promise<{ alumno?: string; tipo?: string; ref?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
  const padre = esPadre(actor.rol);

  const q = await searchParams;
  const tipo = q.tipo === "trimestre" || q.tipo === "mes" ? q.tipo : "anio";
  const referencia = q.ref && /^\d{4}-\d{2}-\d{2}$/.test(q.ref) ? q.ref : hoyEnFamilia();
  const alumnos = padre ? await alumnosDeFamilia() : [];
  if (padre && alumnos.length === 0) redirect("/dashboard/homeschooling");
  const alumnoId = padre ? (alumnos.find((a) => a.id === Number(q.alumno))?.id ?? alumnos[0].id) : actor.id;

  const { desde, hasta } = periodoDe(tipo, referencia);
  const [resumen, materias] = await Promise.all([resumenHoras(actor, { alumnoId, desde, hasta }), listarMaterias(actor)]);
  return <Reporte resumen={resumen} alumnos={alumnos} materias={materias.map((m) => ({ id: m.id, name: m.name }))} esPadre={padre} tipo={tipo} referencia={referencia} />;
}
