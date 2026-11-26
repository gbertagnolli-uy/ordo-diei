import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { MarcoDashboard } from "@/components/app/MarcoDashboard";
import { MainDock } from "@/components/dashboard/MainDock";
import { ModalManager } from "@/components/dashboard/ModalManager";
import { NoticeBar } from "@/components/dashboard/NoticeBar";
import { ActualizarPremios } from "@/components/dashboard/ActualizarPremios";
import { PremioBanner } from "@/components/dashboard/PremioBanner";
import { getEstadoHabitos } from "@/lib/habitos/server";
import { contadoresRecompensasLayout } from "@/lib/recompensas/server";
import { contarComprasCompartidasPendientes } from "@/lib/tienda/server";
import { eventosDeHoy } from "@/lib/cartas/server";
import { enriquecerConRachaYRanking, evaluarIngresoYCofresLayout } from "@/lib/engagement/servidor";
import { bienvenidaDiariaDe, companeroDe } from "@/lib/engagement/companeroServidor";
import { CompaneroFlotante } from "@/components/engagement/CompaneroFlotante";
import { poseFlotante, type EventoApp } from "@/lib/engagement/companeroEscena";
import { isLate } from "@/components/tasks/taskUtils";
import { RegistrarServiceWorker } from "@/components/engagement/RegistrarServiceWorker";
import ModoRelajado from "@/components/homeschooling/neuro/ModoRelajado";
import { CronometroTarea, type TareaEnCurso } from "@/components/tasks/CronometroTarea";

export const dynamic = "force-dynamic";

// Chrome compartido por todas las páginas de /dashboard: barra lateral + Dock.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const usuarioId = Number(session.user.id);
  // Ingreso diario + evaluación acotada de cofres y «Tu parte de hoy» (sin recalcular cada navegación en <45s)
  await evaluarIngresoYCofresLayout({ id: usuarioId, rol: session.user.rolFamiliar });

  // Sin PIN_Secreto: estos datos viajan al cliente (ranking, dock, menú de usuario)
  const [usersRaw, myTasks, estadoUsuario, recompensasLayout, eventosCartas, tiendaCompartidasPendientes, bienvenidaHoy, fichaCompanero, prefAlumno] = await Promise.all([
    prisma.usuario.findMany({ omit: { pinSecretoHash: true } }),
    // Solo lo necesario para los contadores de la barra lateral
    prisma.tarea.findMany({
      where: { asignadoId: session.user.id },
      select: {
        id: true,
        estado: true,
        timerStartedAt: true,
        fechaVencimiento: true,
        horaEjecucion: true,
        // Cronómetro flotante de la tarea en curso (lane 264)
        titulo: true,
        tiempoAcumuladoTimer: true,
        tiempoEjecucionEstimadoSeg: true,
        requiereFotoPrueba: true,
        fotoPruebaUrl: true,
      },
    }),
    getEstadoHabitos(usuarioId),
    contadoresRecompensasLayout(usuarioId, session.user.rolFamiliar),
    eventosDeHoy(usuarioId).catch(() => null),
    contarComprasCompartidasPendientes(usuarioId).catch(() => 0),
    bienvenidaDiariaDe(usuarioId).catch((e) => {
      console.error("[Bienvenida]", e);
      return null;
    }),
    // El compañero flotante (lane 247) aparece en todas las pantallas de /dashboard
    companeroDe(usuarioId).catch((e) => {
      console.error("[Companero]", e);
      return null;
    }),
    prisma.preferenciaAlumno.findUnique({ where: { alumnoId: usuarioId }, select: { modoRelajado: true } }).catch(() => null),
  ]);
  const { premiosPendientes, sorpresas, reconocimientos } = recompensasLayout;
  const users = await enriquecerConRachaYRanking(usersRaw);
  const hayEventosCartas = !!eventosCartas?.hayPendientes;
  const modoRelajado = !!prefAlumno?.modoRelajado;
  const habitosPendientes = estadoUsuario.habitos.filter((h) => h.programadoHoy && !h.hoy).length;
  const currentUser = users.find((u) => u.id === session.user.id) ?? session.user;
  // El compañero llama la atención hasta que se lo elige y cada vez que sube de nivel
  const companeroPendiente = !fichaCompanero?.personaje || fichaCompanero.nivelNuevo;
  const personajeCompanero = fichaCompanero?.personaje ?? null;
  const tasks = myTasks.map((t) => ({
    ...t,
    timerStartedAt: t.timerStartedAt?.toISOString() ?? null,
    fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
    horaEjecucion: t.horaEjecucion?.toISOString() ?? null,
  }));
  // La tarea con el cronómetro en marcha se ve en todas las pantallas (lane 264)
  const enCurso = tasks.find((t) => t.timerStartedAt);
  const tareaEnCurso: TareaEnCurso | null =
    enCurso && enCurso.timerStartedAt
      ? {
          id: enCurso.id,
          titulo: enCurso.titulo,
          timerStartedAt: enCurso.timerStartedAt,
          tiempoAcumuladoTimer: enCurso.tiempoAcumuladoTimer,
          tiempoEjecucionEstimadoSeg: enCurso.tiempoEjecucionEstimadoSeg,
          requiereFotoPrueba: enCurso.requiereFotoPrueba,
          fotoPruebaUrl: enCurso.fotoPruebaUrl,
        }
      : null;
  // Lo que está pasando en la app, para que el compañero lo comente (lane 248)
  const eventosCompanero: EventoApp[] = [
    ...(fichaCompanero?.nivelNuevo ? (["nivel"] as const) : []),
    ...((premiosPendientes ?? 0) > 0 || sorpresas > 0 || reconocimientos > 0 ? (["premio"] as const) : []),
    ...(hayEventosCartas ? (["cartas"] as const) : []),
    ...(tasks.some((t) => isLate(t)) ? (["atrasadas"] as const) : []),
    ...(habitosPendientes > 0 ? (["habitos"] as const) : []),
    ...((fichaCompanero?.racha ?? 0) >= 2 ? (["racha"] as const) : []),
  ];

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
        {/* Barra superior (botón de colapsar + migas) y padding para todas las pantallas (lane 280) */}
        <MarcoDashboard usuarioId={usuarioId} rolFamiliar={session.user.rolFamiliar}>{children}</MarcoDashboard>
      </SidebarInset>
      <ModoRelajado activo={modoRelajado} />
      <ActualizarPremios inicial={{ premiosPendientes, sorpresas, reconocimientos, tiendaCompartidasPendientes }} />
      <ModalManager bienvenidaHoy={bienvenidaHoy} />
      <CronometroTarea tarea={tareaEnCurso} />
      {fichaCompanero && personajeCompanero && (
        <CompaneroFlotante
          datos={{
            usuarioId: Number(session.user.id),
            quien: fichaCompanero.quien,
            personaje: personajeCompanero,
            nombre: fichaCompanero.nombre,
            pose: poseFlotante(fichaCompanero.pose),
            poses: fichaCompanero.poses.desbloqueadas,
            eventos: eventosCompanero,
          }}
        />
      )}
      <MainDock
        currentUser={currentUser}
        allUsers={users}
        companero={fichaCompanero && personajeCompanero ? { usuarioId: Number(session.user.id), nombre: fichaCompanero.nombre, personaje: personajeCompanero, pose: poseFlotante(fichaCompanero.pose) } : null}
      />
    </SidebarProvider>
  );
}
