// Portado de vendor/opencircle/apps/api_v2/src/modules/notifications/service.ts (devscalelabs/opencircle@5a8beada).
// Lane 276: en OpenCircle las crea una cola (utils/queue: createNotificationJob); acá se crean en el momento.
import prisma from "@/lib/prisma";
import { NoEncontradoError } from "@/lib/habitos/server";
import type { Actor } from "@/lib/social/permisos";
import { aNotificacionDTO, usuarioSelect, type NotificationDTO } from "./dto";

type Aviso = { destinoId: number; tipo: "mencion" | "reaccion" | "respuesta" };

/** Crea un aviso por destinatario (nunca a uno mismo). */
export async function notificar(origenId: number, postId: string, avisos: Aviso[]) {
  const validos = avisos.filter((a) => a.destinoId !== origenId);
  if (validos.length === 0) return;
  await prisma.socialNotificacion.createMany({
    data: validos.map((a) => ({ destinoId: a.destinoId, origenId, tipo: a.tipo, postId })),
  });
}

export async function listarNotificaciones(actor: Actor, skip: number, limit: number): Promise<NotificationDTO[]> {
  const filas = await prisma.socialNotificacion.findMany({
    where: { destinoId: actor.id },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: { destino: { select: usuarioSelect }, origen: { select: usuarioSelect } },
  });
  const ids = [...new Set(filas.map((n) => n.postId).filter((x): x is string => !!x))];
  const posts = await prisma.socialPost.findMany({ where: { id: { in: ids } }, select: { id: true, contenido: true, padreId: true } });
  const porId = new Map(posts.map((p) => [p.id, p]));
  return filas.map((n) => aNotificacionDTO({ ...n, post: n.postId ? (porId.get(n.postId) ?? null) : null }));
}

export async function marcarLeida(actor: Actor, id: string): Promise<NotificationDTO> {
  const n = await prisma.socialNotificacion.findFirst({ where: { id, destinoId: actor.id } });
  if (!n) throw new NoEncontradoError("Notificación no encontrada");
  const leida = await prisma.socialNotificacion.update({
    where: { id },
    data: { leida: true },
    include: { destino: { select: usuarioSelect }, origen: { select: usuarioSelect } },
  });
  const post = leida.postId
    ? await prisma.socialPost.findUnique({ where: { id: leida.postId }, select: { contenido: true, padreId: true } })
    : null;
  return aNotificacionDTO({ ...leida, post });
}

/** Para el contador del sidebar. */
export async function contarNoLeidas(actor: Actor): Promise<number> {
  return prisma.socialNotificacion.count({ where: { destinoId: actor.id, leida: false } });
}
