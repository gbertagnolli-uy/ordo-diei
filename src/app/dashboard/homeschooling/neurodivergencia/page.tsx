export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { listarHistorias, obtenerPreferencia } from "@/lib/homeschooling/servidor/neuro";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import PanelNeuro from "@/components/homeschooling/neuro/PanelNeuro";

// Apoyos por alumno: modo relajado, Primero/Después e historias sociales (solo padres)
export default async function NeurodivergenciaPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar) };

  const alumnos = await alumnosDeFamilia();
  const [historias, prefs] = await Promise.all([listarHistorias(actor), Promise.all(alumnos.map((a) => obtenerPreferencia(actor, a.id)))]);
  const preferencias = Object.fromEntries(alumnos.map((a, i) => [a.id, prefs[i]]));
  return <PanelNeuro alumnos={alumnos} preferencias={preferencias} historias={historias} />;
}
