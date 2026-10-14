export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { addMonths, format, parseISO } from "date-fns";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { periodoDe } from "@/lib/homeschooling/horas";
import { listarActividades } from "@/lib/homeschooling/servidor/actividades";
import { listarMaterias } from "@/lib/homeschooling/servidor/cursos";
import { alumnosDeFamilia } from "@/lib/homeschooling/servidor/vistas";
import Horas from "@/components/homeschooling/horas/Horas";

// Actividades fuera de pantalla del mes (un hijo solo ve las suyas)
export default async function HorasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
  const padre = esPadre(actor.rol);

  const pedido = (await searchParams).mes;
  const mes = pedido && /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) ? pedido : hoyEnFamilia().slice(0, 7);
  const { desde, hasta } = periodoDe("mes", `${mes}-01`);
  const base = parseISO(`${mes}-01`);

  const [actividades, materias, alumnos] = await Promise.all([
    listarActividades(actor, { desde, hasta }),
    listarMaterias(actor),
    padre ? alumnosDeFamilia() : Promise.resolve([]),
  ]);
  return (
    <Horas
      actividades={actividades}
      mes={mes}
      mesAnterior={format(addMonths(base, -1), "yyyy-MM")}
      mesSiguiente={format(addMonths(base, 1), "yyyy-MM")}
      esPadre={padre}
      materias={materias.map((m) => ({ id: m.id, name: m.name }))}
      alumnos={alumnos}
    />
  );
}
