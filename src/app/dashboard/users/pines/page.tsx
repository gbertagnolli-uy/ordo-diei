export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/app/PageHeader";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ClientPage from "./ClientPage";

export default async function PinesServerPage() {
  const session = await getSession();
  if (!session || !session.user) redirect("/");

  const { user } = session;
  if (user.rolFamiliar !== "Padre" && user.rolFamiliar !== "Madre") redirect("/dashboard");

  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, rolFamiliar: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <>
      <PageHeader group="Administración" groupHref="/dashboard/admin" title="Restablecer PIN" />
      <ClientPage users={usuarios} />
    </>
  );
}
