export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { obtenerMateria } from "@/lib/homeschooling/servidor/cursos";
import { alumnosDeFamilia, planesPorCurso } from "@/lib/homeschooling/servidor/vistas";
import MateriaPagina from "@/components/homeschooling/cursos/MateriaPagina";
import type { RolFamiliar } from "@/components/homeschooling/roost/auth";

// Materia con sus cursos y lecciones (?module=&lesson= como Roost). Next 16: params es una Promise.
export default async function MateriaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ alumno?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };

  const group = await obtenerMateria(actor, id).catch(() => null);
  if (!group) notFound();

  const alumnos = esPadre(actor.rol) ? await alumnosDeFamilia() : [];
  const pedido = Number((await searchParams).alumno);
  const alumnoInicial = esPadre(actor.rol) ? (alumnos.find((a) => a.id === pedido)?.id ?? alumnos[0]?.id ?? null) : actor.id;

  return (
    <MateriaPagina
      usuario={{ id: actor.id, nombre: String(session.user.nombre ?? ""), rolFamiliar: actor.rol as RolFamiliar }}
      group={group}
      alumnos={alumnos}
      alumnoInicial={alumnoInicial}
      planesPorCurso={esPadre(actor.rol) ? await planesPorCurso(id) : {}}
    />
  );
}
