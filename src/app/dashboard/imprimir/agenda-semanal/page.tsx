// Agenda semanal imprimible (lane 273, Plane #32). Un padre puede imprimir la de un hijo con ?usuarioId=N.
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { usuariosObjetivo } from "@/lib/habitos/permisos";
import { normalizarRotacionConfig } from "@/lib/rotacionTarea";
import { AgendaSemanalImprimible } from "@/components/tasks/AgendaSemanalImprimible";

export const dynamic = "force-dynamic";

export default async function AgendaSemanalPage({ searchParams }: { searchParams: Promise<{ usuarioId?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const sp = await searchParams;
  const pedidoId = sp?.usuarioId ? Number(sp.usuarioId) : undefined;
  let usuarioId = Number(session.user.id);
  if (pedidoId && Number.isInteger(pedidoId) && pedidoId !== usuarioId) {
    const permitidos = await usuariosObjetivo(session, [pedidoId]);
    if (!permitidos) redirect("/dashboard/imprimir/agenda-semanal");
    usuarioId = permitidos[0];
  }

  const [usuarios, todas] = await Promise.all([
    prisma.usuario.findMany({ select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true } }),
    prisma.tarea.findMany({ include: { checklistItems: { orderBy: { orden: "asc" } } } }),
  ]);
  const usuario = usuarios.find((u) => u.id === usuarioId);
  if (!usuario) redirect("/dashboard");

  // Al navegador viajan solo las tareas de este usuario (D6): las suyas, las otras filas de sus
  // tareas compartidas (para «Con …») y las rotativas donde es responsable.
  const misGrupos = new Set(todas.filter((t) => t.asignadoId === usuarioId && t.grupoTareaId).map((t) => t.grupoTareaId));
  const tareasRaw = todas.filter(
    (t) =>
      t.asignadoId === usuarioId ||
      (t.grupoTareaId !== null && misGrupos.has(t.grupoTareaId)) ||
      (normalizarRotacionConfig(t.rotacionConfig)?.responsablesIds.includes(usuarioId) ?? false),
  );

  // Fechas a string para el componente cliente (mismo criterio que /dashboard)
  const tareas = tareasRaw.map((t) => ({
    ...t,
    fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
    horaEjecucion: t.horaEjecucion ? t.horaEjecucion.toISOString() : null,
    timerStartedAt: t.timerStartedAt ? t.timerStartedAt.toISOString() : null,
  }));

  return <AgendaSemanalImprimible usuario={{ id: usuario.id, nombre: usuario.nombre }} usuarios={usuarios} tareas={tareas} />;
}
