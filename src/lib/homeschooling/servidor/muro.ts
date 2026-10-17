// Propio de Ordo (lane 184, Q2): el muro de la familia. Lo ve toda la familia (padres e hijos). Los padres publican avisos y los
// fijan; la app anota sola los logros (libro terminado, oración aprendida, trabajo destacado). Se comenta y se reacciona con las
// mismas piezas de siempre (comentarios.ts). Una sola familia: nada sale de acá.
import prisma from "../../prisma.ts";
import { hoyEnFamilia, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { validarAviso, type TipoPublicacion } from "../muro.ts";
import { DatoInvalidoError } from "./planes.ts";
import type { Actor } from "./materiales.ts";

export type PublicacionVista = {
  id: number;
  tipo: TipoPublicacion;
  titulo: string;
  cuerpo: string | null;
  href: string | null;
  fijada: boolean;
  creadoEn: string;
  autor: { id: number; nombre: string } | null;
  alumno: { id: number; nombre: string; fotoUrl: string | null } | null;
  comentarios: number;
  puedeBorrar: boolean;
};
export type HoyEnLaIglesia = { titulo: string; color: string; tiempo: string; rango: string } | null;
export type Muro = { publicaciones: PublicacionVista[]; hoyEnLaIglesia: HoyEnLaIglesia };

const exigirPadre = (a: Actor) => {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
};

/** El día litúrgico de hoy (rito de 1906, el que usa la casa) para la cabecera del muro */
async function diaLiturgicoDeHoy(hoy: string): Promise<HoyEnLaIglesia> {
  const d = await prisma.diaLiturgico.findFirst({ where: { fecha: new Date(`${hoy}T00:00:00.000Z`) }, orderBy: { version: "desc" } }).catch(() => null);
  return d ? { titulo: d.tituloEs || d.titulo, color: d.color, tiempo: d.tiempo, rango: d.rango } : null;
}

export async function leerMuro(a: Actor, limite = 40, hoy = hoyEnFamilia()): Promise<Muro> {
  const [filas, liturgia] = await Promise.all([
    prisma.publicacionFamilia.findMany({
      orderBy: [{ fijada: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: Math.min(Math.max(limite, 1), 100),
      include: { autor: { select: { id: true, nombre: true } }, alumno: { select: { id: true, nombre: true, fotoUrl: true } }, _count: { select: { comentarios: true } } },
    }),
    diaLiturgicoDeHoy(hoy),
  ]);
  return {
    hoyEnLaIglesia: liturgia,
    publicaciones: filas.map((p) => ({
      id: p.id,
      tipo: p.tipo as TipoPublicacion,
      titulo: p.titulo,
      cuerpo: p.cuerpo,
      href: p.href,
      fijada: p.fijada,
      creadoEn: p.createdAt.toISOString(),
      autor: p.autor,
      alumno: p.alumno,
      comentarios: p._count.comentarios,
      puedeBorrar: esPadre(a.rol),
    })),
  };
}

export async function publicarAviso(a: Actor, d: { titulo: unknown; cuerpo?: unknown; fijada?: boolean }): Promise<PublicacionVista> {
  exigirPadre(a);
  const v = validarAviso(d.titulo, d.cuerpo);
  if (!v.ok) throw new DatoInvalidoError(v.error);
  const autor = await prisma.usuario.findUnique({ where: { id: a.id }, select: { id: true, nombre: true } });
  const p = await prisma.publicacionFamilia.create({ data: { autorId: a.id, tipo: "aviso", titulo: v.titulo, cuerpo: v.cuerpo, fijada: d.fijada === true } });
  // Un aviso de los padres les llega a los hijos en su campana
  const hijos = await prisma.usuario.findMany({ where: { rolFamiliar: { in: ["Hijo", "Hija"] } }, select: { id: true } });
  if (hijos.length > 0) {
    await Promise.allSettled(hijos.map((h) => prisma.avisoEstudio.create({ data: { usuarioId: h.id, tipo: "muro", titulo: `${autor?.nombre ?? "Papá o mamá"} publicó en el muro`, cuerpo: v.titulo, href: "/dashboard/homeschooling/muro" } })));
  }
  return { id: p.id, tipo: "aviso", titulo: p.titulo, cuerpo: p.cuerpo, href: null, fijada: p.fijada, creadoEn: p.createdAt.toISOString(), autor, alumno: null, comentarios: 0, puedeBorrar: true };
}

export async function fijarPublicacion(a: Actor, id: number, fijada: boolean): Promise<void> {
  exigirPadre(a);
  try {
    await prisma.publicacionFamilia.update({ where: { id }, data: { fijada } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") throw new NoEncontradoError("Publicación no encontrada");
    throw e;
  }
}

/** Corrige el título y el texto de un aviso de los padres (los logros los escribe la app: no se editan) */
export async function editarPublicacion(a: Actor, id: number, d: { titulo: unknown; cuerpo?: unknown }): Promise<void> {
  exigirPadre(a);
  const v = validarAviso(d.titulo, d.cuerpo);
  if (!v.ok) throw new DatoInvalidoError(v.error);
  const { count } = await prisma.publicacionFamilia.updateMany({ where: { id, tipo: "aviso" }, data: { titulo: v.titulo, cuerpo: v.cuerpo } });
  if (count === 0) throw new NoEncontradoError("Aviso no encontrado (los logros no se editan)");
}

export async function borrarPublicacion(a: Actor, id: number): Promise<void> {
  exigirPadre(a);
  const { count } = await prisma.publicacionFamilia.deleteMany({ where: { id } });
  if (count === 0) throw new NoEncontradoError("Publicación no encontrada");
}

/** La app anota un logro sola. Nunca rompe la acción que lo origina: si falla, se registra y se sigue. */
export async function publicarLogro(d: { alumnoId: number; titulo: string; cuerpo?: string | null; href?: string | null }): Promise<void> {
  try {
    await prisma.publicacionFamilia.create({ data: { tipo: "logro", alumnoId: d.alumnoId, titulo: d.titulo.slice(0, 120), cuerpo: d.cuerpo ?? null, href: d.href ?? null } });
  } catch (e) {
    console.error("[Muro] no se pudo anotar el logro", e);
  }
}


/** Anota un logro por nombre del hijo (busca el nombre; nunca rompe la acción que lo origina) */
export async function publicarLogroDe(alumnoId: number, hacerFrase: (nombre: string) => { titulo: string; cuerpo?: string | null }, href?: string | null): Promise<void> {
  try {
    const u = await prisma.usuario.findUnique({ where: { id: alumnoId }, select: { nombre: true } });
    if (!u) return;
    const f = hacerFrase(u.nombre);
    await publicarLogro({ alumnoId, titulo: f.titulo, cuerpo: f.cuerpo, href });
  } catch (e) {
    console.error("[Muro] no se pudo anotar el logro", e);
  }
}
