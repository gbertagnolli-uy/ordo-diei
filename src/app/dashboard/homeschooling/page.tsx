export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarMaterias } from "@/lib/homeschooling/servidor/cursos";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import PanelHomeschooling from "@/components/homeschooling/plan/PanelHomeschooling";

// Homeschooling: el padre arma materias, cursos y planes. Hijo/Hija → «Hoy aprendo» (lane H2).
export default async function HomeschoolingPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };

  if (!esPadre(actor.rol)) {
    return (
      <div className="mx-auto max-w-xl p-6 text-center text-muted-foreground">
        <h1 className="mb-2 text-xl font-bold text-foreground">Estudio</h1>
        <p>Próximamente vas a ver acá lo que toca estudiar hoy.</p>
      </div>
    );
  }

  const [materias, alumnos] = await Promise.all([listarMaterias(actor), alumnosDeFamilia()]);
  return <PanelHomeschooling materias={materias} alumnos={alumnos} />;
}
