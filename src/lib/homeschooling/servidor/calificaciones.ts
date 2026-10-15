// Propio de Ordo (lane 172, K1): libreta de calificaciones. Escribir y leer: solo Padre/Madre (un hijo no ve la libreta v1:
// la devolución es en persona, con un padre al lado). Una nota por día lectivo (se puede cambiar) o notas sueltas de examen,
// proyecto, lectura u oral.
import prisma from "../../prisma.ts";
import type { Prisma, TipoCalificacion } from "@prisma/client";
import { aClave, aFecha, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { armarLibreta, promedioGeneral, puntajeValido, TIPOS_CALIFICACION, type MateriaLibreta } from "../calificaciones.ts";
import { DatoInvalidoError } from "./planes.ts";

export type Actor = { id: number; rol: string };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const exigirPadre = (a: Actor) => {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
};

const validarComun = (puntaje: unknown, comentario: string | null | undefined) => {
  if (!puntajeValido(puntaje)) throw new DatoInvalidoError("La nota va de 0 a 100");
  if ((comentario ?? "").length > 1000) throw new DatoInvalidoError("El comentario es demasiado largo (máximo 1000 caracteres)");
};

export type Libreta = { alumno: { id: number; nombre: string }; materias: MateriaLibreta[]; promedio: number | null; cantidad: number };

export async function libretaDe(a: Actor, alumnoId: number): Promise<Libreta> {
  exigirPadre(a);
  const alumno = await prisma.usuario.findUnique({ where: { id: alumnoId }, select: { id: true, nombre: true, rolFamiliar: true } });
  if (!alumno || (alumno.rolFamiliar !== "Hijo" && alumno.rolFamiliar !== "Hija")) throw new NoEncontradoError("Alumno no encontrado");
  const [filas, materias] = await Promise.all([
    prisma.calificacion.findMany({ where: { alumnoId }, orderBy: [{ fecha: "desc" }, { id: "desc" }], include: { materia: { select: { nombre: true, color: true } } } }),
    prisma.materia.findMany({ where: { activa: true, OR: [{ recursos: { some: { planes: { some: { alumnoId } } } } }, { calificaciones: { some: { alumnoId } } }] }, select: { id: true, nombre: true, color: true } }),
  ]);
  const lib = armarLibreta(
    filas.map((f) => ({ id: f.id, fecha: aClave(f.fecha), titulo: f.titulo, tipo: f.tipo, puntaje: f.puntaje, comentario: f.comentario, diaLectivoId: f.diaLectivoId, materiaId: f.materiaId, materia: f.materia.nombre, color: f.materia.color })),
    materias
  );
  return { alumno: { id: alumno.id, nombre: alumno.nombre }, materias: lib, promedio: promedioGeneral(lib), cantidad: filas.length };
}

export type DatosNota = { alumnoId: number; materiaId: number; titulo: string; tipo?: TipoCalificacion; puntaje: number; comentario?: string | null; fecha: string };

export async function crearNota(a: Actor, d: DatosNota) {
  exigirPadre(a);
  validarComun(d.puntaje, d.comentario);
  if (!d.titulo.trim()) throw new DatoInvalidoError("Falta el título");
  if (!FECHA.test(d.fecha)) throw new DatoInvalidoError("Fecha no válida");
  if (d.tipo && !TIPOS_CALIFICACION.includes(d.tipo)) throw new DatoInvalidoError("Tipo de nota no válido");
  const [alumno, materia] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: d.alumnoId }, select: { rolFamiliar: true } }),
    prisma.materia.findUnique({ where: { id: d.materiaId }, select: { id: true } }),
  ]);
  if (!alumno || (alumno.rolFamiliar !== "Hijo" && alumno.rolFamiliar !== "Hija")) throw new DatoInvalidoError("La nota es para un hijo o una hija");
  if (!materia) throw new NoEncontradoError("Materia no encontrada");
  return prisma.calificacion.create({ data: { alumnoId: d.alumnoId, materiaId: d.materiaId, titulo: d.titulo.trim().slice(0, 150), tipo: d.tipo ?? "tarea", puntaje: d.puntaje, comentario: d.comentario?.trim() || null, fecha: aFecha(d.fecha), calificadaPorId: a.id } });
}

/** La nota de un día lectivo: la crea o la cambia (alumno, materia y título salen del plan) */
export async function calificarDia(a: Actor, diaId: number, puntaje: number, comentario?: string | null) {
  exigirPadre(a);
  validarComun(puntaje, comentario);
  const dia = await prisma.diaLectivo.findUnique({ where: { id: diaId }, include: { plan: { select: { alumnoId: true, recurso: { select: { titulo: true, materiaId: true } } } } } });
  if (!dia) throw new NoEncontradoError("Día no encontrado");
  const datos = { puntaje, comentario: comentario?.trim() || null, calificadaPorId: a.id };
  return prisma.calificacion.upsert({
    where: { diaLectivoId: diaId },
    create: { ...datos, alumnoId: dia.plan.alumnoId, materiaId: dia.plan.recurso.materiaId, diaLectivoId: diaId, titulo: dia.plan.recurso.titulo, tipo: "tarea", fecha: dia.fecha },
    update: datos,
  });
}

export async function notaDelDia(a: Actor, diaId: number) {
  exigirPadre(a);
  const n = await prisma.calificacion.findUnique({ where: { diaLectivoId: diaId }, select: { id: true, puntaje: true, comentario: true } });
  return n;
}

export type CambiosNota = { titulo?: string; tipo?: TipoCalificacion; puntaje?: number; comentario?: string | null; fecha?: string };

export async function editarNota(a: Actor, id: number, c: CambiosNota) {
  exigirPadre(a);
  const data: Prisma.CalificacionUpdateInput = {};
  if (c.puntaje !== undefined) {
    validarComun(c.puntaje, c.comentario);
    data.puntaje = c.puntaje;
  } else if (c.comentario !== undefined) validarComun(0, c.comentario);
  if (c.comentario !== undefined) data.comentario = c.comentario?.trim() || null;
  if (c.titulo !== undefined) {
    if (!c.titulo.trim()) throw new DatoInvalidoError("Falta el título");
    data.titulo = c.titulo.trim().slice(0, 150);
  }
  if (c.tipo !== undefined) {
    if (!TIPOS_CALIFICACION.includes(c.tipo)) throw new DatoInvalidoError("Tipo de nota no válido");
    data.tipo = c.tipo;
  }
  if (c.fecha !== undefined) {
    if (!FECHA.test(c.fecha)) throw new DatoInvalidoError("Fecha no válida");
    data.fecha = aFecha(c.fecha);
  }
  try {
    return await prisma.calificacion.update({ where: { id }, data });
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") throw new NoEncontradoError("Nota no encontrada");
    throw e;
  }
}

export async function borrarNota(a: Actor, id: number) {
  exigirPadre(a);
  const { count } = await prisma.calificacion.deleteMany({ where: { id } });
  if (count === 0) throw new NoEncontradoError("Nota no encontrada");
}
