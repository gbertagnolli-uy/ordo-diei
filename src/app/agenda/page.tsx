import prisma from "@/lib/prisma";
import { enriquecerConRachaYRanking } from "@/lib/engagement/servidor";
import { proyectarEventosCalendario } from "@/lib/proyeccionCalendario";
import { AgendaDashboardClient, AgendaTaskItem, AgendaUser } from "@/components/agenda/AgendaDashboardClient";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  let users: AgendaUser[] = [];
  let tasks: any[] = [];

  try {
    const rawUsers = await prisma.usuario.findMany({ omit: { pinSecretoHash: true } });
    const conRanking = await enriquecerConRachaYRanking(rawUsers);

    users = conRanking.sort((a, b) => {
      const isParent = (role: string) => role === "Padre" || role === "Madre";
      if (isParent(a.rolFamiliar) && !isParent(b.rolFamiliar)) return -1;
      if (!isParent(a.rolFamiliar) && isParent(b.rolFamiliar)) return 1;
      return new Date(a.fechaNacimiento).getTime() - new Date(b.fechaNacimiento).getTime();
    });

    tasks = await prisma.tarea.findMany({
      include: {
        checklistItems: { orderBy: { orden: "asc" } },
        asignado: true,
        creador: true,
      },
    });
  } catch (err) {
    console.error("Error cargando agenda del día:", err);
  }

  const hoy = new Date();
  const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0, 0);
  const hoyFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

  const eventos = proyectarEventosCalendario(tasks, users, hoyInicio, hoyFin);

  const taskItems: AgendaTaskItem[] = eventos.map((ev) => {
    const res = ev.resource || {};
    return {
      id: ev.id,
      title: ev.title || res.titulo,
      descripcion: res.descripcion || null,
      estado: res.estado || "Pendiente",
      dificultad: res.dificultad,
      puntosGenerados: res.puntosGenerados || 0,
      tiempoEstimadoSeg: res.tiempoEjecucionEstimadoSeg || 0,
      horaEjecucion: res.horaEjecucion ? new Date(res.horaEjecucion).toISOString() : null,
      start: ev.start ? ev.start.toISOString() : null,
      checklistItems: res.checklistItems || [],
      asignados: (res.asignados || []).map((a: any) => ({
        id: a.id,
        nombre: a.nombre,
        rolFamiliar: a.rolFamiliar || "",
        fotoUrl: a.fotoUrl || null,
      })),
      tipoTareaCalculado: res.tipoTareaCalculado,
    };
  });

  const fechaTexto = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(hoy);

  return (
    <AgendaDashboardClient
      initialUsers={users}
      tasks={taskItems}
      fechaTexto={fechaTexto}
    />
  );
}
