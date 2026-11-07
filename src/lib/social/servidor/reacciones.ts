// Portado de vendor/opencircle/apps/api_v2/src/modules/reactions/service.ts (devscalelabs/opencircle@5a8beada).
// Lane 276: la reacción se borra de verdad (la clave es post + usuario + emoji, sin deletedAt); avisa al
// autor con cualquier emoji (OpenCircle solo con "like", que en su front es el único botón).
import prisma from "@/lib/prisma";
import { NoEncontradoError } from "@/lib/habitos/server";
import type { Actor } from "@/lib/social/permisos";
import { EntradaInvalidaError } from "./canales";
import { aUsuarioDTO, usuarioSelect } from "./dto";
import { notificar } from "./notificaciones";
import { postVisible } from "./posts";

function emojiValido(v: unknown): string {
  if (typeof v !== "string" || !v.trim() || v.length > 32) throw new EntradaInvalidaError("Reacción inválida");
  return v.trim();
}

const aReaccionDTO = (r: { postId: string; usuarioId: number; emoji: string; createdAt: Date; usuario: Parameters<typeof aUsuarioDTO>[0] }) => ({
  id: `${r.postId}:${r.usuarioId}:${r.emoji}`,
  user_id: String(r.usuarioId),
  post_id: r.postId,
  emoji: r.emoji,
  user: aUsuarioDTO(r.usuario),
  created_at: r.createdAt.toISOString(),
  updated_at: r.createdAt.toISOString(),
});

/** toggleReaction: si ya estaba, la quita y responde { message }; si no, la crea y avisa al autor. */
export async function alternarReaccion(actor: Actor, entrada: { post_id?: unknown; emoji?: unknown }) {
  if (typeof entrada.post_id !== "string") throw new EntradaInvalidaError("Falta el post");
  const emoji = emojiValido(entrada.emoji);
  const post = await postVisible(entrada.post_id, actor);
  const clave = { postId_usuarioId_emoji: { postId: post.id, usuarioId: actor.id, emoji } };
  if (await prisma.socialReaccion.findUnique({ where: clave })) {
    await prisma.socialReaccion.delete({ where: clave });
    return { message: "Reacción quitada" };
  }
  const r = await prisma.socialReaccion.create({
    data: { postId: post.id, usuarioId: actor.id, emoji },
    include: { usuario: { select: usuarioSelect } },
  });
  if (post.autorId !== actor.id) await notificar(actor.id, post.id, [{ destinoId: post.autorId, tipo: "reaccion" }]);
  return aReaccionDTO(r);
}

/** getReactionsByPost: agrupadas por emoji. */
export async function reaccionesDePost(actor: Actor, postId: string) {
  await postVisible(postId, actor);
  const filas = await prisma.socialReaccion.findMany({
    where: { postId },
    include: { usuario: { select: usuarioSelect } },
    orderBy: { createdAt: "asc" },
  });
  const grupos: { emoji: string; count: number; users: ReturnType<typeof aReaccionDTO>[] }[] = [];
  for (const f of filas) {
    let g = grupos.find((x) => x.emoji === f.emoji);
    if (!g) grupos.push((g = { emoji: f.emoji, count: 0, users: [] }));
    g.count += 1;
    g.users.push(aReaccionDTO(f));
  }
  return grupos;
}

/** deleteReaction. */
export async function quitarReaccion(actor: Actor, postId: string, emojiPedido: unknown) {
  const emoji = emojiValido(emojiPedido);
  const borradas = await prisma.socialReaccion.deleteMany({ where: { postId, usuarioId: actor.id, emoji } });
  if (borradas.count === 0) throw new NoEncontradoError("Reacción no encontrada");
  return { message: "Reacción quitada" };
}
