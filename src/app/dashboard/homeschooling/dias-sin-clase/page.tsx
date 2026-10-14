export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarNoLectivos } from "@/lib/homeschooling/servidor/planes";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import DiasSinClase from "@/components/homeschooling/plan/DiasSinClase";

export default async function DiasSinClasePage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling");
  const [dias, alumnos] = await Promise.all([listarNoLectivos(Number(session.user.id)), alumnosDeFamilia()]);
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <DiasSinClase dias={dias} alumnos={alumnos} />
    </div>
  );
}
