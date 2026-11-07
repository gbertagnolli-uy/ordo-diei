// Portado de vendor/opencircle/apps/api_v2/src/modules/channels/service.ts y channel-members/service.ts
// (devscalelabs/opencircle@5a8beada). Lane 276: «admin» de OpenCircle = padre o madre (D6); la forma de
// salida es la de packages/core (D11).
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { NoAutorizadoError, NoEncontradoError } from "@/lib/habitos/server";
import { esPadre } from "@/lib/habitos/permisos";
import { puedeVerCanal, type Actor } from "@/lib/social/permisos";
import { aCanalDTO, type ChannelDTO } from "./dto";

export class EntradaInvalidaError extends Error {
  status = 400;
}

const textoONulo = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Ids de los canales que el actor puede ver (todos si es padre). */
export async function canalesVisiblesIds(actor: Actor): Promise<string[]> {
  const canales = await prisma.socialCanal.findMany({
    where: { deletedAt: null },
    select: { id: true, tipo: true, materiaId: true, miembros: { where: { usuarioId: actor.id }, select: { usuarioId: true } } },
  });
  return canales
    .filter((c) => puedeVerCanal(c, actor, c.miembros.map((m) => m.usuarioId)))
    .map((c) => c.id);
}

/** El canal, si existe y el actor lo puede ver; si no, NoEncontrado / NoAutorizado como OpenCircle. */
export async function canalVisible(where: { id: string } | { slug: string }, actor: Actor) {
  const canal = await prisma.socialCanal.findFirst({
    where: { ...where, deletedAt: null },
    include: { miembros: { select: { usuarioId: true } } },
  });
  if (!canal) throw new NoEncontradoError("Canal no encontrado");
  if (!puedeVerCanal(canal, actor, canal.miembros.map((m) => m.usuarioId)))
    throw new NoAutorizadoError("No sos miembro de este canal privado");
  return canal;
}

export async function listarCanales(actor: Actor, skip: number, limit: number): Promise<ChannelDTO[]> {
  const ids = await canalesVisiblesIds(actor);
  const canales = await prisma.socialCanal.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: "asc" },
    skip,
    take: limit,
  });
  return canales.map(aCanalDTO);
}

function slugDe(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Solo padres. Un canal privado arranca con quien lo crea y los miembros pedidos. */
export async function crearCanal(actor: Actor, entrada: Record<string, unknown>): Promise<ChannelDTO> {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo los padres crean canales");
  const nombre = textoONulo(entrada.name, 80);
  if (!nombre) throw new EntradaInvalidaError("El canal necesita un nombre");
  const slug = slugDe(textoONulo(entrada.slug, 80) ?? nombre);
  if (!slug) throw new EntradaInvalidaError("El nombre del canal no sirve para la dirección");
  const tipo = entrada.type === "private" ? "privado" : "publico";
  const miembros = Array.isArray(entrada.member_ids)
    ? [...new Set(entrada.member_ids.map(Number).filter(Number.isInteger))]
    : [];
  try {
    const canal = await prisma.socialCanal.create({
      data: {
        nombre,
        slug,
        descripcion: textoONulo(entrada.description, 300),
        emoji: textoONulo(entrada.emoji, 16) ?? undefined,
        tipo,
        miembros:
          tipo === "privado"
            ? { create: [...new Set([actor.id, ...miembros])].map((usuarioId) => ({ usuarioId })) }
            : undefined,
      },
    });
    return aCanalDTO(canal);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      throw new EntradaInvalidaError("Ya hay un canal con esa dirección");
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003")
      throw new EntradaInvalidaError("Alguno de los miembros no existe");
    throw e;
  }
}

/** Solo padres (en OpenCircle, cualquier miembro; acá la moderación es de los padres, D6). */
export async function editarCanal(actor: Actor, id: string, entrada: Record<string, unknown>): Promise<ChannelDTO> {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo los padres editan canales");
  const canal = await prisma.socialCanal.findFirst({ where: { id, deletedAt: null } });
  if (!canal) throw new NoEncontradoError("Canal no encontrado");
  const nombre = entrada.name === undefined ? undefined : textoONulo(entrada.name, 80);
  if (nombre === null) throw new EntradaInvalidaError("El canal necesita un nombre");
  const editado = await prisma.socialCanal.update({
    where: { id },
    data: {
      nombre,
      descripcion: entrada.description === undefined ? undefined : textoONulo(entrada.description, 300),
      emoji: entrada.emoji === undefined ? undefined : (textoONulo(entrada.emoji, 16) ?? canal.emoji),
      tipo: entrada.type === undefined ? undefined : entrada.type === "private" ? "privado" : "publico",
    },
  });
  return aCanalDTO(editado);
}

/** Borrado lógico, solo padres (como OpenCircle: solo admins). */
export async function borrarCanal(actor: Actor, id: string): Promise<{ message: string }> {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo los padres borran canales");
  const canal = await prisma.socialCanal.findFirst({ where: { id, deletedAt: null } });
  if (!canal) throw new NoEncontradoError("Canal no encontrado");
  await prisma.socialCanal.update({ where: { id }, data: { deletedAt: new Date() } });
  return { message: "Canal borrado" };
}

/** Miembros de un canal (channel-members/service.ts: listMembers). */
export async function listarMiembros(actor: Actor, canalId: string) {
  await canalVisible({ id: canalId }, actor);
  const miembros = await prisma.socialCanalMiembro.findMany({ where: { canalId }, orderBy: { createdAt: "asc" } });
  return miembros.map((m) => ({
    id: `${m.canalId}:${m.usuarioId}`,
    channel_id: m.canalId,
    user_id: String(m.usuarioId),
    created_at: m.createdAt.toISOString(),
    updated_at: m.createdAt.toISOString(),
  }));
}

/** addMember / removeMember: solo padres. */
export async function cambiarMiembro(actor: Actor, canalId: string, usuarioId: number, agregar: boolean) {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo los padres cambian los miembros");
  const canal = await prisma.socialCanal.findFirst({ where: { id: canalId, deletedAt: null } });
  if (!canal) throw new NoEncontradoError("Canal no encontrado");
  if (!Number.isInteger(usuarioId) || !(await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true } })))
    throw new NoEncontradoError("Usuario no encontrado");
  if (agregar) {
    await prisma.socialCanalMiembro.upsert({
      where: { canalId_usuarioId: { canalId, usuarioId } },
      create: { canalId, usuarioId },
      update: {},
    });
    return { message: "Miembro agregado" };
  }
  await prisma.socialCanalMiembro.deleteMany({ where: { canalId, usuarioId } });
  return { message: "Miembro quitado" };
}
