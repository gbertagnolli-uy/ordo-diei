// Portado de vendor/opencircle/apps/api_v2/src/modules/posts/service.ts (devscalelabs/opencircle@5a8beada).
// Lane 276: reglas de D6 (src/lib/social/permisos.ts), forma de packages/core (D11), menciones y
// respuestas avisan con una notificación (como notifications/service.ts).
import prisma from "@/lib/prisma";
import { NoAutorizadoError, NoEncontradoError } from "@/lib/habitos/server";
import { extraerMenciones, puedeBorrarPost, puedeEditarPost, puedeFijar, puedeVerCanal, type Actor } from "@/lib/social/permisos";
import { canalVisible, canalesVisiblesIds, EntradaInvalidaError } from "./canales";
import { aPostDTO, usuarioSelect, type PostDTO } from "./dto";
import { notificar } from "./notificaciones";

const MAX_TEXTO = 5000;

export const incluirPost = {
  autor: { select: usuarioSelect },
  canal: true,
  medios: { orderBy: { orden: "asc" as const } },
  reacciones: { select: { usuarioId: true, emoji: true }, orderBy: { createdAt: "asc" as const } },
  respuestas: {
    where: { deletedAt: null },
    select: { autorId: true, autor: { select: { nombre: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};

/** El post (o comentario) si existe y el actor puede ver su canal. */
async function postVisible(id: string, actor: Actor) {
  const post = await prisma.socialPost.findFirst({ where: { id, deletedAt: null }, include: incluirPost });
  if (!post) throw new NoEncontradoError("Post no encontrado");
  if (post.canal) {
    const miembros = await prisma.socialCanalMiembro.findMany({ where: { canalId: post.canal.id }, select: { usuarioId: true } });
    if (post.canal.deletedAt || !puedeVerCanal(post.canal, actor, miembros.map((m) => m.usuarioId)))
      throw new NoAutorizadoError("No sos miembro de este canal privado");
  }
  return post;
}

export type FiltroPosts = { skip: number; limit: number; userId?: number; postType?: string; parentId?: string; channelSlug?: string };

/** listPosts: más nuevos primero; sin canal pedido, el timeline mezcla los posts sin canal y los de canales visibles. */
export async function listarPosts(actor: Actor, f: FiltroPosts): Promise<PostDTO[]> {
  const where: Record<string, unknown> = { deletedAt: null };
  if (f.userId !== undefined) where.autorId = f.userId;
  if (f.parentId) where.padreId = f.parentId;
  else if (f.postType === "comment") where.padreId = { not: null };
  else where.padreId = null;
  if (f.channelSlug) {
    const canal = await canalVisible({ slug: f.channelSlug }, actor);
    where.canalId = canal.id;
  } else if (!f.parentId) {
    where.OR = [{ canalId: null }, { canalId: { in: await canalesVisiblesIds(actor) } }];
  } else {
    await postVisible(f.parentId, actor);
  }
  const posts = await prisma.socialPost.findMany({
    where,
    include: incluirPost,
    orderBy: f.parentId ? [{ createdAt: "asc" }] : [{ fijado: "desc" }, { createdAt: "desc" }],
    skip: f.skip,
    take: f.limit,
  });
  return posts.map((p) => aPostDTO(p, actor.id));
}

export async function obtenerPost(actor: Actor, id: string): Promise<PostDTO> {
  return aPostDTO(await postVisible(id, actor), actor.id);
}

export type NuevoPost = { content?: unknown; channel_id?: unknown; parent_id?: unknown; enlace_lms?: unknown };

/** createPost / createPostWithFiles. `urlsMedios` = imágenes ya guardadas con guardarImagen. */
export async function crearPost(actor: Actor, entrada: NuevoPost, urlsMedios: string[] = []): Promise<PostDTO> {
  const contenido = typeof entrada.content === "string" ? entrada.content.trim() : "";
  if (!contenido && urlsMedios.length === 0) throw new EntradaInvalidaError("El post está vacío");
  if (contenido.length > MAX_TEXTO) throw new EntradaInvalidaError(`El post supera los ${MAX_TEXTO} caracteres`);

  let canalId: string | null = null;
  let padre: { id: string; autorId: number; canalId: string | null } | null = null;
  if (typeof entrada.parent_id === "string" && entrada.parent_id) {
    const p = await postVisible(entrada.parent_id, actor);
    padre = { id: p.id, autorId: p.autorId, canalId: p.canalId };
    canalId = p.canalId; // el comentario vive en el canal de su post
  } else if (typeof entrada.channel_id === "string" && entrada.channel_id) {
    canalId = (await canalVisible({ id: entrada.channel_id }, actor)).id;
  }

  const post = await prisma.socialPost.create({
    data: {
      contenido,
      autorId: actor.id,
      canalId,
      padreId: padre?.id ?? null,
      enlaceLms: entrada.enlace_lms && typeof entrada.enlace_lms === "object" ? (entrada.enlace_lms as object) : undefined,
      medios: { create: urlsMedios.map((url, orden) => ({ url, autorId: actor.id, tipo: "imagen", orden })) },
    },
    include: incluirPost,
  });

  const familia = await prisma.usuario.findMany({ select: { id: true, nombre: true } });
  const mencionados = extraerMenciones(contenido, familia, actor.id);
  const avisos: { destinoId: number; tipo: "mencion" | "respuesta" }[] = mencionados.map((destinoId) => ({ destinoId, tipo: "mencion" }));
  if (padre && padre.autorId !== actor.id && !mencionados.includes(padre.autorId)) avisos.push({ destinoId: padre.autorId, tipo: "respuesta" });
  await notificar(actor.id, post.id, avisos);

  return aPostDTO(post, actor.id);
}

/** updatePost: el autor cambia el texto; un padre fija o desfija (D6). */
export async function editarPost(actor: Actor, id: string, entrada: { content?: unknown; is_pinned?: unknown }): Promise<PostDTO> {
  const post = await postVisible(id, actor);
  const data: { contenido?: string; fijado?: boolean } = {};
  if (entrada.content !== undefined) {
    if (!puedeEditarPost(post, actor)) throw new NoAutorizadoError("Solo podés editar tus posts");
    const contenido = typeof entrada.content === "string" ? entrada.content.trim() : "";
    if (!contenido) throw new EntradaInvalidaError("El post está vacío");
    if (contenido.length > MAX_TEXTO) throw new EntradaInvalidaError(`El post supera los ${MAX_TEXTO} caracteres`);
    data.contenido = contenido;
  }
  if (entrada.is_pinned !== undefined) {
    if (!puedeFijar(actor)) throw new NoAutorizadoError("Solo los padres fijan posts");
    data.fijado = entrada.is_pinned === true;
  }
  const editado = await prisma.socialPost.update({ where: { id }, data, include: incluirPost });
  return aPostDTO(editado, actor.id);
}

/** deletePost: borrado lógico; el autor o un padre (OpenCircle no comprobaba el autor, D11). */
export async function borrarPost(actor: Actor, id: string): Promise<{ message: string }> {
  const post = await postVisible(id, actor);
  if (!puedeBorrarPost(post, actor)) throw new NoAutorizadoError("Solo podés borrar tus posts");
  await prisma.socialPost.update({ where: { id }, data: { deletedAt: new Date() } });
  return { message: "Post borrado" };
}

export { postVisible };
