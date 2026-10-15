// Propio de Ordo (lane 191, G7): mensajes directos entre los integrantes de la familia. Solo los dos participantes leen una conversación.
// Sin tiempo real: la pantalla consulta cada pocos segundos mientras está abierta. Texto plano de hasta 1000 caracteres.
import prisma from "../../prisma.ts";
import { NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { limpiarComentario, MAX_COMENTARIO } from "../comentarios.ts";
import { DatoInvalidoError } from "./planes.ts";
import type { Actor } from "./materiales.ts";

export type Interlocutor = {
  id: number;
  nombre: string;
  fotoUrl: string | null;
  esPadre: boolean;
  ultimo: { texto: string; deMi: boolean; creadoEn: string } | null;
  sinLeer: number;
};
export type MensajeVista = { id: number; texto: string; deMi: boolean; creadoEn: string; leido: boolean };

/** Todos los demás integrantes de la familia, con el último mensaje y los no leídos; los que más hablaron, primero */
export async function conversaciones(a: Actor): Promise<{ personas: Interlocutor[]; sinLeer: number }> {
  const [personas, ultimos, noLeidos] = await Promise.all([
    prisma.usuario.findMany({ where: { id: { not: a.id } }, select: { id: true, nombre: true, fotoUrl: true, rolFamiliar: true }, orderBy: { nombre: "asc" } }),
    prisma.mensajeFamilia.findMany({ where: { OR: [{ deId: a.id }, { paraId: a.id }] }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 400, select: { deId: true, paraId: true, texto: true, createdAt: true } }),
    prisma.mensajeFamilia.groupBy({ by: ["deId"], where: { paraId: a.id, leidoEn: null }, _count: { _all: true } }),
  ]);
  const lista: Interlocutor[] = personas.map((p) => {
    const u = ultimos.find((m) => m.deId === p.id || m.paraId === p.id) ?? null;
    return {
      id: p.id,
      nombre: p.nombre,
      fotoUrl: p.fotoUrl,
      esPadre: esPadre(p.rolFamiliar),
      ultimo: u ? { texto: u.texto.length > 80 ? `${u.texto.slice(0, 77)}…` : u.texto, deMi: u.deId === a.id, creadoEn: u.createdAt.toISOString() } : null,
      sinLeer: noLeidos.find((n) => n.deId === p.id)?._count._all ?? 0,
    };
  });
  lista.sort((x, y) => (y.ultimo?.creadoEn ?? "").localeCompare(x.ultimo?.creadoEn ?? "") || x.nombre.localeCompare(y.nombre, "es"));
  return { personas: lista, sinLeer: lista.reduce((n, p) => n + p.sinLeer, 0) };
}

export async function contarSinLeer(usuarioId: number): Promise<number> {
  return prisma.mensajeFamilia.count({ where: { paraId: usuarioId, leidoEn: null } });
}

/** La conversación con otra persona (últimos 100 mensajes, del más viejo al más nuevo); marca como leídos los que recibí */
export async function hilo(a: Actor, conId: number): Promise<MensajeVista[]> {
  if (conId === a.id) throw new DatoInvalidoError("No podés escribirte a vos mismo");
  if (!(await prisma.usuario.findUnique({ where: { id: conId }, select: { id: true } }))) throw new NoEncontradoError("Persona no encontrada");
  const filas = await prisma.mensajeFamilia.findMany({
    where: { OR: [{ deId: a.id, paraId: conId }, { deId: conId, paraId: a.id }] },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
  });
  const ahora = new Date();
  const sinLeer = filas.filter((m) => m.paraId === a.id && m.leidoEn === null).map((m) => m.id);
  if (sinLeer.length > 0) await prisma.mensajeFamilia.updateMany({ where: { id: { in: sinLeer } }, data: { leidoEn: ahora } });
  return filas
    .reverse()
    .map((m) => ({ id: m.id, texto: m.texto, deMi: m.deId === a.id, creadoEn: m.createdAt.toISOString(), leido: m.leidoEn !== null || sinLeer.includes(m.id) }));
}

export async function enviar(a: Actor, paraId: number, texto: unknown): Promise<MensajeVista> {
  const limpio = limpiarComentario(texto);
  if (!limpio) throw new DatoInvalidoError(`Escribí un mensaje de hasta ${MAX_COMENTARIO} caracteres`);
  if (paraId === a.id) throw new DatoInvalidoError("No podés escribirte a vos mismo");
  if (!(await prisma.usuario.findUnique({ where: { id: paraId }, select: { id: true } }))) throw new NoEncontradoError("Persona no encontrada");
  const m = await prisma.mensajeFamilia.create({ data: { deId: a.id, paraId, texto: limpio } });
  return { id: m.id, texto: m.texto, deMi: true, creadoEn: m.createdAt.toISOString(), leido: false };
}
