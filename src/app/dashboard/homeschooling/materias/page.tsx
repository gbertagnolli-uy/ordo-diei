export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarMaterias } from "@/lib/homeschooling/servidor/cursos";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import { resumenPanel } from "@/lib/homeschooling/servidor/panel";
import { hoyEnFamilia } from "@/lib/habitos/server";
import PanelMaterias from "@/components/homeschooling/cursos/PanelMaterias";

// Panel «Materias»: gestión integral de materias, cursos, lecciones/clases, materiales de estudio y evaluaciones.
export default async function MateriasPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
  if (!esPadre(actor.rol)) redirect("/dashboard/homeschooling");

  const hoy = hoyEnFamilia();
  const [materias, alumnos, panel] = await Promise.all([
    listarMaterias(actor),
    alumnosDeFamilia(),
    resumenPanel(hoy),
  ]);

  return (
    <PanelMaterias
      materias={materias}
      panel={panel.materias}
      archivadas={panel.archivadas}
      alumnos={alumnos}
      hoy={hoy}
    />
  );
}
