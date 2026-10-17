export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { haySancion } from "@/lib/comportamiento/sancionServer";
import { companeroDe } from "@/lib/engagement/companeroServidor";
import { PageHeader } from "@/components/app/PageHeader";
import { CompaneroView } from "@/components/engagement/CompaneroView";

export default async function CompaneroPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const usuarioId = Number(session.user.id);

  const datos = await companeroDe(usuarioId, new Date(), { sancionado: await haySancion(prisma, usuarioId) });

  return (
    <div className="flex flex-col">
      <PageHeader group="Colección" title="Compañero" subtitle="Tu héroe: crece con tu nivel" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        <CompaneroView datos={datos} />
      </main>
    </div>
  );
}
