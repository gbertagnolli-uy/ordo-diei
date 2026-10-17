// Propio de Ordo (lane 176, L2): memoria. Un hijo aprende oraciones y listas de memoria; las recita en voz alta frente a un
// padre, que lo califica (otra vez / difícil / bien / fácil), y la repetición espaciada decide cuándo toca repasar. Califican
// solo los padres: es la prueba de que se sabe de verdad. El hijo ve sus textos y lo que le toca hoy.
import prisma from "../../prisma.ts";
import type { Memorizacion } from "@prisma/client";
import { aClave, hoyEnFamilia, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { CATALOGO_MEMORIA, itemDeCatalogo } from "../catolico.ts";
import { LOGROS } from "../muro.ts";
import { publicarLogroDe } from "./muro.ts";
import { DatoInvalidoError } from "./planes.ts";
import { nuevaTarjeta, responderNivel, type NivelRecitado, type TarjetaGuardada } from "./repaso.ts";

export type Actor = { id: number; rol: string };
export type MemoriaVista = { id: number; clave: string | null; titulo: string; texto: string; proximo: string; repasos: number; dominada: boolean; toca: boolean; ultimoEn: string | null };
export type ListaMemoria = { alumno: { id: number; nombre: string }; items: MemoriaVista[]; tocanHoy: number; dominadas: number };

const NIVELES: NivelRecitado[] = ["otra_vez", "dificil", "bien", "facil"];

const exigirPadre = (a: Actor) => {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
};

function aVista(m: Memorizacion, hoy: string): MemoriaVista {
  const proximo = aClave(m.proximo);
  return { id: m.id, clave: m.clave, titulo: m.titulo, texto: m.texto, proximo, repasos: m.repasos, dominada: m.dominada, toca: !m.dominada && proximo <= hoy, ultimoEn: m.ultimoEn ? aClave(m.ultimoEn) : null };
}

async function exigirHijo(alumnoId: number) {
  const u = await prisma.usuario.findUnique({ where: { id: alumnoId }, select: { id: true, nombre: true, rolFamiliar: true } });
  if (!u || (u.rolFamiliar !== "Hijo" && u.rolFamiliar !== "Hija")) throw new NoEncontradoError("Alumno no encontrado");
  return u;
}

export async function listaDeMemoria(a: Actor, alumnoId: number, hoy = hoyEnFamilia()): Promise<ListaMemoria> {
  if (!esPadre(a.rol) && a.id !== alumnoId) throw new NoAutorizadoError("Solo podés ver tu propia memoria");
  const alumno = await exigirHijo(alumnoId);
  const filas = await prisma.memorizacion.findMany({ where: { alumnoId }, orderBy: [{ dominada: "asc" }, { proximo: "asc" }, { id: "asc" }] });
  const items = filas.map((m) => aVista(m, hoy));
  return { alumno: { id: alumno.id, nombre: alumno.nombre }, items, tocanHoy: items.filter((i) => i.toca).length, dominadas: items.filter((i) => i.dominada).length };
}

/** Agrega del catálogo de la casa a uno o varios hijos (lo que ya tienen se salta). Devuelve cuántos se agregaron. */
export async function agregarDelCatalogo(a: Actor, alumnoIds: number[], claves: string[], hoy = hoyEnFamilia()): Promise<number> {
  exigirPadre(a);
  const ids = [...new Set(alumnoIds)];
  const items = [...new Set(claves)].map((c) => itemDeCatalogo(c));
  if (ids.length === 0 || items.length === 0) throw new DatoInvalidoError("Elegí al menos un hijo y una oración");
  if (items.some((i) => !i)) throw new DatoInvalidoError("Hay una oración que no está en el catálogo");
  for (const id of ids) await exigirHijo(id);
  const ahora = new Date(`${hoy}T00:00:00.000Z`);
  let creadas = 0;
  for (const alumnoId of ids) {
    for (const item of items) {
      if (!item) continue;
      const { tarjeta, proximo } = nuevaTarjeta(ahora);
      const r = await prisma.memorizacion.createMany({ data: [{ alumnoId, clave: item.clave, titulo: item.titulo, texto: item.texto, tarjeta, proximo }], skipDuplicates: true });
      creadas += r.count;
    }
  }
  return creadas;
}

/** Un texto propio (un poema, un salmo, una lista de la clase) */
export async function crearPropia(a: Actor, d: { alumnoId: number; titulo: string; texto: string }, hoy = hoyEnFamilia()): Promise<MemoriaVista> {
  exigirPadre(a);
  const titulo = d.titulo.trim();
  const texto = d.texto.trim();
  if (!titulo) throw new DatoInvalidoError("Falta el título");
  if (texto.length < 5) throw new DatoInvalidoError("Falta el texto para aprender");
  if (texto.length > 5000) throw new DatoInvalidoError("El texto es demasiado largo (máximo 5000 caracteres)");
  await exigirHijo(d.alumnoId);
  const { tarjeta, proximo } = nuevaTarjeta(new Date(`${hoy}T00:00:00.000Z`));
  return aVista(await prisma.memorizacion.create({ data: { alumnoId: d.alumnoId, titulo: titulo.slice(0, 150), texto, tarjeta, proximo } }), hoy);
}

/** Lo que toca recitar hoy (solo padres: es quien escucha) */
export async function colaDeHoy(a: Actor, alumnoId: number, hoy = hoyEnFamilia()): Promise<MemoriaVista[]> {
  exigirPadre(a);
  await exigirHijo(alumnoId);
  const filas = await prisma.memorizacion.findMany({ where: { alumnoId, dominada: false, proximo: { lte: new Date(`${hoy}T23:59:59.999Z`) } }, orderBy: [{ proximo: "asc" }, { id: "asc" }], take: 30 });
  return filas.map((m) => aVista(m, hoy));
}

/** El padre califica el recitado */
export async function calificarRecitado(a: Actor, id: number, nivel: string, ahora = new Date()): Promise<MemoriaVista> {
  exigirPadre(a);
  if (!NIVELES.includes(nivel as NivelRecitado)) throw new DatoInvalidoError("Calificación no válida");
  const m = await prisma.memorizacion.findUnique({ where: { id } });
  if (!m) throw new NoEncontradoError("Texto no encontrado");
  const r = responderNivel(m.tarjeta as unknown as TarjetaGuardada, nivel as NivelRecitado, ahora);
  const actualizada = await prisma.memorizacion.update({ where: { id }, data: { tarjeta: r.tarjeta, proximo: r.proximo, repasos: { increment: 1 }, dominada: r.resuelta, ultimoEn: ahora } });
  if (r.resuelta && !m.dominada) await publicarLogroDe(m.alumnoId, (n) => LOGROS.oracion(n, m.titulo), "/dashboard/homeschooling/muro");
  return aVista(actualizada, hoyEnFamilia());
}

export async function quitarDeMemoria(a: Actor, id: number): Promise<void> {
  exigirPadre(a);
  const { count } = await prisma.memorizacion.deleteMany({ where: { id } });
  if (count === 0) throw new NoEncontradoError("Texto no encontrado");
}

export async function editarMemoria(a: Actor, id: number, d: { titulo: string; texto: string }): Promise<void> {
  exigirPadre(a);
  const titulo = d.titulo.trim();
  const texto = d.texto.trim();
  if (!titulo || titulo.length > 150) throw new DatoInvalidoError("El título debe tener entre 1 y 150 caracteres");
  if (texto.length < 5 || texto.length > 5000) throw new DatoInvalidoError("El texto debe tener entre 5 y 5000 caracteres");
  const { count } = await prisma.memorizacion.updateMany({ where: { id }, data: { titulo, texto } });
  if (count === 0) throw new NoEncontradoError("Texto no encontrado");
}

export const catalogoCompleto = () => CATALOGO_MEMORIA;

/** Cuántos textos le toca recitar hoy (para la pantalla «Hoy» del hijo) */
export async function contarMemoriaHoy(alumnoId: number, hoy = hoyEnFamilia()): Promise<number> {
  return prisma.memorizacion.count({ where: { alumnoId, dominada: false, proximo: { lte: new Date(`${hoy}T23:59:59.999Z`) } } });
}
