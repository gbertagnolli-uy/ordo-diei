import { AuthPageClient } from "@/components/auth/AuthPageClient";
import prisma from "@/lib/prisma";
import { Particles } from "@/components/ui/particles";
import { enriquecerConRachaYRanking } from "@/lib/engagement/servidor";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Lógica de DB y reglas de negocio del Backend
  let users: any[] = [];
  try {
    const rawUsers = await prisma.usuario.findMany({ omit: { pinSecretoHash: true } });
    const conRanking = await enriquecerConRachaYRanking(rawUsers);
    
    // Regla: Orden estricto (Padres primero, Hijos luego ordenados por edad)
    users = conRanking.sort((a, b) => {
      const isParent = (role: string) => role === "Padre" || role === "Madre";
      if (isParent(a.rolFamiliar) && !isParent(b.rolFamiliar)) return -1;
      if (!isParent(a.rolFamiliar) && isParent(b.rolFamiliar)) return 1;
      return new Date(a.fechaNacimiento).getTime() - new Date(b.fechaNacimiento).getTime();
    });
  } catch (err) {
    console.error("Error cargando usuarios", err);
  }

  return (
    <main className="dark relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,#352216_0%,#1A1410_55%,#0A0604_100%)] text-foreground">
      <Particles className="absolute inset-0" quantity={90} ease={80} color="#C9A84C" refresh />
      <AuthPageClient initialUsers={users} />
    </main>
  );
}
