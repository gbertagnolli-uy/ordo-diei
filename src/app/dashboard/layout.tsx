import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { MainDock } from "@/components/dashboard/MainDock";
import { ModalManager } from "@/components/dashboard/ModalManager";
import { NoticeBar } from "@/components/dashboard/NoticeBar";
import { ActualizarPremios } from "@/components/dashboard/ActualizarPremios";
import { PremioBanner } from "@/components/dashboard/PremioBanner";
import { getEstadoHabitos } from "@/lib/habitos/server";
import { contarReconocimientosSinAbrir, contarRecompensasPendientes, contarSorpresasSinAbrir } from "@/lib/recompensas/server";
import { contarComprasCompartidasPendientes } from "@/lib/tienda/server";
import { otorgarCofreDelDia } from "@/lib/comportamiento/server";
import { eventosDeHoy } from "@/lib/cartas/server";
import { nivelDe, xpTotal } from "@/lib/niveles";
import { parteDeHoy, registrarIngreso } from "@/lib/engagement/servidor";
import { RegistrarServiceWorker } from "@/components/engagement/RegistrarServiceWorker";
import ModoRelajado from "@/components/homeschooling/neuro/ModoRelajado";

export const dynamic = "force-dynamic";

// Chrome compartido por todas las páginas de /dashboard: barra lateral + Dock.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  // Desde las 18:00 el cofre del día llega al entrar (si los padres evaluaron bien el día)
  // y se anota el ingreso del día para la racha en la app (lane 201)
  await Promise.all([
    otorgarCofreDelDia(Number(session.user.id)).catch((e) => console.error("[Cofre]", e)),
    registrarIngreso(Number(session.user.id)).catch((e) => console.error("[Ingreso]", e)),
  ]);
  // Los padres: se premian las misiones de «Tu parte de hoy» (y llega el cofre) donde sea que estén,
  // no solo al abrir el panel de administración
  await parteDeHoy({ id: Number(session.user.id), rol: session.user.rolFamiliar }).catch((e) => console.error("[ParteDeHoy]", e));

  // Sin PIN_Secreto: estos datos viajan al cliente (ranking, dock, menú de usuario)
  const [users, myTasks, estadoUsuario, premiosPendientes, eventosCartas, sorpresas, reconocimientos, tiendaCompartidasPendientes] = await Promise.all([
    prisma.usuario.findMany({ omit: { pinSecretoHash: true } }),
    // Solo lo necesario para los contadores de la barra lateral
    prisma.tarea.findMany({
      where: { asignadoId: session.user.id },
      select: { id: true, estado: true, timerStartedAt: true, fechaVencimiento: true, horaEjecucion: true },
    }),
    getEstadoHabitos(Number(session.user.id)),
    contarRecompensasPendientes(Number(session.user.id), session.user.rolFamiliar),
    eventosDeHoy(Number(session.user.id)).catch(() => null),
    contarSorpresasSinAbrir(Number(session.user.id)),
    contarReconocimientosSinAbrir(Number(session.user.id)),
    contarComprasCompartidasPendientes(Number(session.user.id)).catch(() => 0),
  ]);
  const hayEventosCartas = !!eventosCartas?.hayPendientes;
  const modoRelajado = !!(await prisma.preferenciaAlumno.findUnique({ where: { alumnoId: Number(session.user.id) }, select: { modoRelajado: true } }).catch(() => null))?.modoRelajado;
  const habitosPendientes = estadoUsuario.habitos.filter((h) => h.programadoHoy && !h.hoy).length;
  const currentUser = users.find((u) => u.id === session.user.id) ?? session.user;
  // El compañero llama la atención hasta que se lo elige y cada vez que sube de nivel
  const fichaCompanero = await prisma.companero.findUnique({ where: { usuarioId: Number(session.user.id) }, select: { personaje: true, nivelVisto: true } }).catch(() => null);
  const companeroPendiente = !fichaCompanero?.personaje || nivelDe(xpTotal(currentUser)).level > fichaCompanero.nivelVisto;
  const tasks = myTasks.map((t) => ({
    ...t,
    timerStartedAt: t.timerStartedAt?.toISOString() ?? null,
    fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
    horaEjecucion: t.horaEjecucion?.toISOString() ?? null,
  }));

  return (
    <SidebarProvider>
      <RegistrarServiceWorker />
      <AppSidebar
        currentUser={currentUser}
        tasks={tasks}
        habitosPendientes={habitosPendientes}
        premiosPendientes={premiosPendientes}
        hayEventosCartas={hayEventosCartas}
        companeroPendiente={companeroPendiente}
        tiendaCompartidasPendientes={tiendaCompartidasPendientes}
      />
      <SidebarInset className="min-w-0">
        <PremioBanner cantidad={sorpresas} reconocimientos={reconocimientos} />
        <NoticeBar />
        <div className="flex flex-1 flex-col pb-24">{children}</div>
      </SidebarInset>
      <ModoRelajado activo={modoRelajado} />
      <ActualizarPremios />
      <ModalManager />
      <MainDock currentUser={currentUser} allUsers={users} />
    </SidebarProvider>
  );
}
