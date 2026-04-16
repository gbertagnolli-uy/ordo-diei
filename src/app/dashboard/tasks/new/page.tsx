export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ClientPage from "./ClientPage";
import { getSession } from "@/lib/session";

export default async function NewTaskServerPage() {
  const session = await getSession();
  
  if (!session || !session.user) {
    redirect("/");
  }

  const { user } = session;
  const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";
  
  if (!isParent) {
    // Si no es Padre/Madre, lo sacamos de aquí
    redirect("/dashboard");
  }

  const users = await prisma.usuario.findMany({
    select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true },
    // Mostramos a los padres primero, luego por edad
    orderBy: {
      fechaNacimiento: "asc"
    }
  });

  return <ClientPage users={users} />;
}
