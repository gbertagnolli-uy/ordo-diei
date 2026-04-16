import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ClientRulesPage from "./ClientRulesPage";

export const dynamic = 'force-dynamic';

export default async function RulesServerPage() {
  const session = await getSession();
  
  if (!session || !session.user) {
    redirect("/");
  }

  const { user } = session;
  const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";
  
  // Buscar las reglas actuales en la DB (o crearlas vacías si no existen)
  let regla = await prisma.reglaHogar.findFirst();
  
  if (!regla) {
    regla = await prisma.reglaHogar.create({
      data: {
        textoEstricto: "1. Mantener orden en las habitaciones.\n2. Cumplir los horarios de tareas.",
        actualizadoPorId: user.id,
      }
    });
  }

  return <ClientRulesPage isAdmin={isParent} initialRules={regla.textoEstricto} />;
}
