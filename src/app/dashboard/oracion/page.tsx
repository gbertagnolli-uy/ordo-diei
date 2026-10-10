export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/app/PageHeader";
import { OracionClient } from "@/components/oracion/OracionClient";
import { FamiliaOracion } from "@/components/oracion/FamiliaOracion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import prisma from "@/lib/prisma";
import { esPadre } from "@/lib/oracion/permisos";
import { getEstadoOracion, getEstadosOracion, hoyEnFamilia } from "@/lib/oracion/server";
import { misteriosDelDia } from "@/lib/oracion/catalogo";

export default async function OracionPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const yo = Number(session.user.id);
  const hoy = hoyEnFamilia();
  const { serie } = misteriosDelDia(hoy);
  const padre = esPadre(session.user.rolFamiliar);

  const miembros = padre
    ? await prisma.usuario.findMany({ select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true }, orderBy: { id: "asc" } })
    : [];
  const estados = padre ? await getEstadosOracion(miembros.map((m) => m.id)) : [await getEstadoOracion(yo)];
  const propio = estados.find((e) => e.usuarioId === yo) ?? { usuarioId: yo, plan: null };

  return (
    <div className="flex flex-col">
      <PageHeader group="Vida espiritual" title="Oración" subtitle={`Hoy, misterios ${serie.toLowerCase()}`} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        {padre ? (
          <Tabs defaultValue="propio" className="gap-6">
            <TabsList>
              <TabsTrigger value="propio">Mi camino</TabsTrigger>
              <TabsTrigger value="familia">Familia</TabsTrigger>
            </TabsList>
            <TabsContent value="propio"><OracionClient inicial={propio} /></TabsContent>
            <TabsContent value="familia"><FamiliaOracion miembros={miembros} estados={estados} hoy={hoy} /></TabsContent>
          </Tabs>
        ) : (
          <OracionClient inicial={propio} />
        )}
      </main>
    </div>
  );
}
