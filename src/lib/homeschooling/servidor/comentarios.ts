// Propio de Ordo (lane 174, Q1): comentarios y reacciones entre los integrantes de la familia, sobre una lección, un material o
// una evidencia. Ve y comenta quien puede ver eso (padres siempre; un hijo, lo suyo; una evidencia destacada la ve toda la
// familia). Borra el autor o cualquier padre. Una sola familia: no hay nada público ni entre familias.
import prisma from "../../prisma.ts";
import type { Prisma } from "@prisma/client";
import { NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { esEmoji, limpiarComentario, MAX_COMENTARIO, EMOJIS, type Emoji } from "../comentarios.ts";
import { DatoInvalidoError } from "./planes.ts";
import { obtenerMaterial, type Actor } from "./materiales.ts";
import { avisarComentario } from "./avisos.ts";

export type DestinoComentario = { leccionId: number } | { materialId: number } | { evidenciaId: number };
export type ResumenReacciones = Record<Emoji, { total: number; mia: boolean }>;
export type ComentarioVista = {
  id: number;
  texto: string;
  creadoEn: string;
  editado: boolean;
  autor: { id: number; nombre: string; fotoUrl: string | null; esPadre: boolean };
  reacciones: ResumenReacciones;
  puedeBorrar: boolean;
};
export type Conversacion = { comentarios: ComentarioVista[]; reacciones: ResumenReacciones | null };

const vacias = (): ResumenReacciones => Object.fromEntries(EMOJIS.map((e) => [e, { total: 0, mia: false }])) as ResumenReacciones;

function resumir(filas: { emoji: string; usuarioId: number }[], yo: number): ResumenReacciones {
  const r = vacias();
  for (const f of filas) {
    if (!esEmoji(f.emoji)) continue;
    r[f.emoji].total += 1;
    if (f.usuarioId === yo) r[f.emoji].mia = true;
  }
  return r;
}

/** Lanza si el actor no puede ver el destino; devuelve los hijos a quienes concierne (para los avisos), el título y el enlace */
async function exigirAcceso(a: Actor, d: DestinoComentario): Promise<{ alumnoIds: number[]; titulo: string; href: string }> {
  const RAIZ = "/dashboard/homeschooling";
  if ("leccionId" in d) {
    const l = await prisma.leccionCurso.findUnique({ where: { id: d.leccionId }, select: { titulo: true, recurso: { select: { id: true, materiaId: true, planes: { select: { alumnoId: true } } } } } });
    if (!l) throw new NoEncontradoError("Lección no encontrada");
    const alumnoIds = l.recurso.planes.map((p) => p.alumnoId);
    if (!esPadre(a.rol) && !alumnoIds.includes(a.id)) throw new NoAutorizadoError("No tenés acceso a esta lección");
    return { alumnoIds, titulo: l.titulo, href: `${RAIZ}/materias/${l.recurso.materiaId}?module=${l.recurso.id}&lesson=${d.leccionId}` };
  }
  if ("materialId" in d) {
    const m = await obtenerMaterial(a, d.materialId);
    let alumnoIds: number[] = m.alumnoId ? [m.alumnoId] : [];
    if (m.diaLectivoId) {
      const dia = await prisma.diaLectivo.findUnique({ where: { id: m.diaLectivoId }, select: { plan: { select: { alumnoId: true } } } });
      if (dia) alumnoIds = [dia.plan.alumnoId];
    } else if (m.leccionId) {
      const planes = await prisma.planCurso.findMany({ where: { recurso: { lecciones: { some: { id: m.leccionId } } } }, select: { alumnoId: true } });
      alumnoIds = planes.map((p) => p.alumnoId);
    }
    return { alumnoIds, titulo: m.titulo, href: RAIZ };
  }
  const e = await prisma.evidenciaAprendizaje.findUnique({ where: { id: d.evidenciaId }, select: { alumnoId: true, titulo: true, destacada: true } });
  if (!e) throw new NoEncontradoError("Evidencia no encontrada");
  if (!esPadre(a.rol) && e.alumnoId !== a.id && !e.destacada) throw new NoAutorizadoError("No tenés acceso a esta evidencia");
  return { alumnoIds: [e.alumnoId], titulo: e.titulo || "Evidencia", href: `${RAIZ}/portafolio` };
}

const donde = (d: DestinoComentario): Prisma.ComentarioEstudioWhereInput => d;

export async function conversacion(a: Actor, d: DestinoComentario): Promise<Conversacion> {
  await exigirAcceso(a, d);
  const filas = await prisma.comentarioEstudio.findMany({
    where: donde(d),
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 200,
    include: { autor: { select: { id: true, nombre: true, fotoUrl: true, rolFamiliar: true } }, reacciones: { select: { emoji: true, usuarioId: true } } },
  });
  const propias = "evidenciaId" in d ? await prisma.reaccionEstudio.findMany({ where: { evidenciaId: d.evidenciaId }, select: { emoji: true, usuarioId: true } }) : null;
  return {
    comentarios: filas.map((c) => ({
      id: c.id,
      texto: c.texto,
      creadoEn: c.createdAt.toISOString(),
      editado: c.editadoEn !== null,
      autor: { id: c.autor.id, nombre: c.autor.nombre, fotoUrl: c.autor.fotoUrl, esPadre: esPadre(c.autor.rolFamiliar) },
      reacciones: resumir(c.reacciones, a.id),
      puedeBorrar: c.autorId === a.id || esPadre(a.rol),
    })),
    reacciones: propias ? resumir(propias, a.id) : null,
  };
}

export async function comentar(a: Actor, d: DestinoComentario, texto: unknown): Promise<ComentarioVista> {
  const limpio = limpiarComentario(texto);
  if (!limpio) throw new DatoInvalidoError(`Escribí un comentario de hasta ${MAX_COMENTARIO} caracteres`);
  const dueño = await exigirAcceso(a, d);
  const c = await prisma.comentarioEstudio.create({
    data: { autorId: a.id, texto: limpio, ...d },
    include: { autor: { select: { id: true, nombre: true, fotoUrl: true, rolFamiliar: true } } },
  });
  await avisarComentario({ autorId: a.id, autorNombre: c.autor.nombre, autorEsPadre: esPadre(a.rol), alumnoIds: dueño.alumnoIds, titulo: dueño.titulo, href: dueño.href, texto: limpio }).catch((e) => console.error("[Aviso]", e));
  return { id: c.id, texto: c.texto, creadoEn: c.createdAt.toISOString(), editado: false, autor: { id: c.autor.id, nombre: c.autor.nombre, fotoUrl: c.autor.fotoUrl, esPadre: esPadre(c.autor.rolFamiliar) }, reacciones: vacias(), puedeBorrar: true };
}

export async function borrarComentario(a: Actor, id: number): Promise<void> {
  const c = await prisma.comentarioEstudio.findUnique({ where: { id }, select: { autorId: true } });
  if (!c) throw new NoEncontradoError("Comentario no encontrado");
  if (c.autorId !== a.id && !esPadre(a.rol)) throw new NoAutorizadoError("Solo podés borrar tus comentarios");
  await prisma.comentarioEstudio.delete({ where: { id } });
}

/** Pone o saca una reacción (una por emoji y persona); devuelve el resumen del comentario o la evidencia */
export async function alternarReaccion(a: Actor, objetivo: { comentarioId: number } | { evidenciaId: number }, emoji: unknown): Promise<ResumenReacciones> {
  if (!esEmoji(emoji)) throw new DatoInvalidoError("Reacción no válida");
  if ("comentarioId" in objetivo) {
    const c = await prisma.comentarioEstudio.findUnique({ where: { id: objetivo.comentarioId }, select: { leccionId: true, materialId: true, evidenciaId: true } });
    if (!c) throw new NoEncontradoError("Comentario no encontrado");
    await exigirAcceso(a, c.leccionId ? { leccionId: c.leccionId } : c.materialId ? { materialId: c.materialId } : { evidenciaId: c.evidenciaId as number });
  } else {
    await exigirAcceso(a, { evidenciaId: objetivo.evidenciaId });
  }
  const clave = "comentarioId" in objetivo ? { usuarioId_comentarioId_emoji: { usuarioId: a.id, comentarioId: objetivo.comentarioId, emoji } } : { usuarioId_evidenciaId_emoji: { usuarioId: a.id, evidenciaId: objetivo.evidenciaId, emoji } };
  const existe = await prisma.reaccionEstudio.findUnique({ where: clave });
  if (existe) await prisma.reaccionEstudio.delete({ where: { id: existe.id } });
  else await prisma.reaccionEstudio.create({ data: { usuarioId: a.id, emoji, ...objetivo } });
  const filas = await prisma.reaccionEstudio.findMany({ where: objetivo, select: { emoji: true, usuarioId: true } });
  return resumir(filas, a.id);
}
