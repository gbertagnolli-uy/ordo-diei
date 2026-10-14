export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarEvidencias } from "@/lib/homeschooling/servidor/evidencia";
import { listarMaterias } from "@/lib/homeschooling/servidor/cursos";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import Portafolio from "@/components/homeschooling/portafolio/Portafolio";

// Portafolio: todos lo ven, pero un hijo solo recibe sus propias evidencias
export default async function PortafolioPage({ searchParams }: { searchParams: Promise<{ alumno?: string; materia?: string; mes?: string; destacadas?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
  const padre = esPadre(actor.rol);
  const q = await searchParams;

  const [evidencias, materias, alumnos] = await Promise.all([
    listarEvidencias(actor, {
      alumnoId: Number(q.alumno) || null,
      materiaId: Number(q.materia) || null,
      mes: q.mes ?? null,
      destacada: q.destacadas === "1",
    }),
    listarMaterias(actor),
    padre ? alumnosDeFamilia() : Promise.resolve([]),
  ]);
  return <Portafolio evidencias={evidencias} esPadre={padre} alumnos={alumnos} materias={materias.map((m) => ({ id: m.id, name: m.name }))} />;
}
