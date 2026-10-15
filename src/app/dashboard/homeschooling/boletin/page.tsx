export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { esPadre } from "@/lib/habitos/permisos";
import { periodoVigente } from "@/lib/homeschooling/boletin";
import { armarBoletin, listarPeriodos } from "@/lib/homeschooling/servidor/boletin";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import BoletinVista from "@/components/homeschooling/boletin/BoletinVista";

// Boletín de cada hijo por período (solo padres)
export default async function BoletinPage({ searchParams }: { searchParams: Promise<{ alumno?: string; periodo?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard/homeschooling");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar) };

  const alumnos = await alumnosDeFamilia();
  if (alumnos.length === 0) redirect("/dashboard/homeschooling");
  const q = await searchParams;
  const alumnoId = alumnos.find((a) => a.id === Number(q.alumno))?.id ?? alumnos[0].id;
  const hoy = hoyEnFamilia();
  const periodos = await listarPeriodos(actor);
  const periodo = periodos.find((p) => p.id === Number(q.periodo)) ?? periodoVigente(periodos, hoy);
  const boletin = periodo ? await armarBoletin(actor, alumnoId, periodo.id, hoy) : null;
  return <BoletinVista boletin={boletin} periodos={periodos} alumnos={alumnos.map((a) => ({ id: a.id, nombre: a.nombre }))} anio={Number(hoy.slice(0, 4))} />;
}
