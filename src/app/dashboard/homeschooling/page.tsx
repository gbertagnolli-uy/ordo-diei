export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarMaterias } from "@/lib/homeschooling/servidor/cursos";
import { alumnosDeFamilia, progresoPorAlumno } from "@/lib/homeschooling/servidor/vistas";
import { resumenPanel } from "@/lib/homeschooling/servidor/panel";
import { avisosParaPadre } from "@/lib/homeschooling/servidor/quiz";
import { estadisticasEvidencias } from "@/lib/homeschooling/servidor/evidencia";
import PanelHomeschooling from "@/components/homeschooling/plan/PanelHomeschooling";
import HoyAprendo from "@/components/homeschooling/hoy/HoyAprendo";
import prisma from "@/lib/prisma";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { asegurarTareasDeHoy } from "@/lib/homeschooling/servidor/tareas";
import { leccionesDeHoy } from "@/lib/homeschooling/servidor/hoy";
import { materialSueltoDeHoy } from "@/lib/homeschooling/servidor/materiales";
import { contarMemoriaHoy } from "@/lib/homeschooling/servidor/memoria";
import { lecturaEnCurso } from "@/lib/homeschooling/servidor/lectura";
import { resumenSemanal } from "@/lib/homeschooling/servidor/resumenSemana";
import { saludoDe } from "@/lib/homeschooling/saludo";
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import { APP_TZ } from "@/lib/habitos/server";
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
    const [dias, yo, preferencia, historias, sueltos, memoriaHoy, lectura] = await Promise.all([
      leccionesDeHoy(actor.id, hoy),
      prisma.usuario.findUnique({ where: { id: actor.id }, select: { nombre: true, fotoUrl: true, streakDays: true } }),
      obtenerPreferencia(actor, actor.id),
      historiasPendientes(actor.id, hoy),
      materialSueltoDeHoy(actor.id, hoy),
      contarMemoriaHoy(actor.id, hoy),
      lecturaEnCurso(actor.id),
    ]);
    return <HoyAprendo nombre={yo?.nombre ?? ""} fotoUrl={yo?.fotoUrl ?? null} racha={yo?.streakDays ?? 0} dias={dias} preferencia={preferencia} historias={historias} sueltos={sueltos} saludo={saludoDe(Number(format(new Date(), "H", { in: tz(APP_TZ) })))} memoriaHoy={memoriaHoy} lectura={lectura} />;
  }

  const [materias, alumnos, progresos, evidencias, avisos, panel, semana] = await Promise.all([
    listarMaterias(actor),
    alumnosDeFamilia(),
    progresoPorAlumno(),
    estadisticasEvidencias(actor),
    avisosParaPadre(actor),
    resumenPanel(),
    resumenSemanal(actor),
  ]);
  return <PanelHomeschooling materias={materias} panel={panel.materias} hoy={panel.hoy} archivadas={panel.archivadas} alumnos={alumnos} progresos={progresos} pendientes={evidencias.pending} avisos={avisos} semana={semana} />;
}
