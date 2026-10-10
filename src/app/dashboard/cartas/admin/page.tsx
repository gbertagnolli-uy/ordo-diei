export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { adminListarCartas } from "@/lib/cartas/server";
import { PageHeader } from "@/components/app/PageHeader";
import { AdminCartasView } from "@/components/cartas/AdminCartasView";

export default async function AdminCartasPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }

  // Control de acceso: solo Padre o Madre
  if (session.user.rolFamiliar !== "Padre" && session.user.rolFamiliar !== "Madre") {
    redirect("/dashboard/cartas");
  }

  const cartas = await adminListarCartas();

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader group="Colección" title="Administración de Cartas" />
      <main className="flex-1 w-full">
        <AdminCartasView cartasIniciales={cartas} />
      </main>
    </div>
  );
}
