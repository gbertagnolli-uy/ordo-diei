export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarMaterias } from "@/lib/homeschooling/servidor/cursos";
import { alumnosDeFamilia, progresoPorAlumno } from "@/lib/homeschooling/servidor/vistas";
import { avisosParaPadre } from "@/lib/homeschooling/servidor/quiz";
import { estadisticasEvidencias } from "@/lib/homeschooling/servidor/evidencia";
import PanelHomeschooling from "@/components/homeschooling/plan/PanelHomeschooling";
import HoyAprendo from "@/components/homeschooling/hoy/HoyAprendo";
import prisma from "@/lib/prisma";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { asegurarTareasDeHoy } from "@/lib/homeschooling/servidor/tareas";
import { leccionesDeHoy } from "@/lib/homeschooling/servidor/hoy";
import { historiasPendientes, obtenerPreferencia } from "@/lib/homeschooling/servidor/neuro";

// Homeschooling: el padre arma materias, cursos y planes; Hijo/Hija ve «Hoy aprendo».
export default async function HomeschoolingPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };

  if (!esPadre(actor.rol)) {
    // Hijo/Hija → «Hoy aprendo»: antes de dibujar, se asegura la Tarea de cada día lectivo de hoy
    const hoy = hoyEnFamilia();
    await asegurarTareasDeHoy(actor.id, hoy);
    const [dias, yo, preferencia, historias] = await Promise.all([
      leccionesDeHoy(actor.id, hoy),
      prisma.usuario.findUnique({ where: { id: actor.id }, select: { nombre: true, fotoUrl: true, streakDays: true } }),
      obtenerPreferencia(actor, actor.id),
      historiasPendientes(actor.id, hoy),
    ]);
    return <HoyAprendo nombre={yo?.nombre ?? ""} fotoUrl={yo?.fotoUrl ?? null} racha={yo?.streakDays ?? 0} dias={dias} preferencia={preferencia} historias={historias} />;
  }

  const [materias, alumnos, progresos, evidencias, avisos] = await Promise.all([listarMaterias(actor), alumnosDeFamilia(), progresoPorAlumno(), estadisticasEvidencias(actor), avisosParaPadre(actor)]);
  return <PanelHomeschooling materias={materias} alumnos={alumnos} progresos={progresos} pendientes={evidencias.pending} avisos={avisos} />;
}
