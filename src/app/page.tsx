import { AuthPageClient } from "@/components/auth/AuthPageClient";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Lógica de DB y reglas de negocio del Backend
  let users: any[] = [];
  try {
    const rawUsers = await prisma.usuario.findMany();
    
    // Regla: Orden estricto (Padres primero, Hijos luego ordenados por edad)
    users = rawUsers.sort((a, b) => {
      const isParent = (role: string) => role === "Padre" || role === "Madre";
      if (isParent(a.rolFamiliar) && !isParent(b.rolFamiliar)) return -1;
      if (!isParent(a.rolFamiliar) && isParent(b.rolFamiliar)) return 1;
      return new Date(a.fechaNacimiento).getTime() - new Date(b.fechaNacimiento).getTime();
    });
  } catch (err) {
    console.error("Error cargando usuarios", err);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1A1410] via-[#352216] to-[#0A0604] text-[var(--on-surface)] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#C4956A] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-[#8B5E3C] rounded-full mix-blend-screen filter blur-[128px] opacity-15 animate-pulse-slow"></div>

      <AuthPageClient initialUsers={users} />
    </main>
  );
}
