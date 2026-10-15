import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import CabeceraEstudio from "@/components/homeschooling/nav/CabeceraEstudio";

export const dynamic = "force-dynamic";

// Marco común de Estudio: migas de pan y pestañas (padre: panel, plan, revisión…; hijo: hoy, portafolio…)
export default async function EstudioLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const padre = esPadre(session.user.rolFamiliar);
  const pendientes = padre ? await prisma.evidenciaAprendizaje.count({ where: { estado: "pendiente" } }) : 0;
  return (
    <>
      <CabeceraEstudio esPadre={padre} pendientes={pendientes} />
      {children}
    </>
  );
}
