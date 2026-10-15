// Portado de vendor/roost/src/services/module.ts, vendor/roost/src/services/group.ts y vendor/roost/src/db/adapters/mongodb/index.ts
// (msrbuilds/roost@492af47). Cambios: Prisma en vez de Supabase, plan por alumno, permisos por rol familiar en vez de RLS.
// Materias, cursos (recursos) y lecciones (Prisma). Cuerpos de los services de Roost (module.ts, group.ts)
// con la misma forma de respuesta (DTO de roost/dto.ts). Escribir: solo Padre/Madre. Un Hijo/Hija lee
// únicamente lo que tiene un plan suyo. `hoy` entra como parámetro ('YYYY-MM-DD').
import prisma from "../../prisma.ts";
import type { DificultadTarea, Prisma, TipoRecurso, UnidadContenido } from "@prisma/client";
import { NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { ConflictoError, DatoInvalidoError, recalcularEn } from "./planes.ts";
import { mapGroup, mapModuleWithProgress, mapRecording, unidadesCubiertas } from "../roost/dto.ts";
import { parsearEnlaceVideo } from "../video.ts";

export type Actor = { id: number; rol: string };
type Tx = Prisma.TransactionClient;

const exigirPadre = (a: Actor) => {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
};

/** Tipos cuyo `totalUnidades` es la cantidad de lecciones (ARQUITECTURA §4 regla 8) */
export const TIPOS_CON_LECCIONES: TipoRecurso[] = ["curso_videos", "enlaces"];

// ---------- Lectura ----------

/** Materia visible: el padre ve todas; un hijo solo las que tienen un plan suyo */
async function materiaVisible(a: Actor, materiaId: number) {
  const materia = await prisma.materia.findUnique({ where: { id: materiaId } });
  if (!materia) throw new NoEncontradoError("Materia no encontrada");
  if (!esPadre(a.rol)) {
    const plan = await prisma.planCurso.findFirst({ where: { alumnoId: a.id, recurso: { materiaId } }, select: { id: true } });
    if (!plan) throw new NoAutorizadoError("No tenés acceso a esta materia");
  }
  return materia;
}

export async function listarMaterias(a: Actor) {
  const where: Prisma.MateriaWhereInput = esPadre(a.rol)
    ? { activa: true }
    : { activa: true, recursos: { some: { planes: { some: { alumnoId: a.id } } } } };
  const materias = await prisma.materia.findMany({ where, orderBy: [{ orden: "asc" }, { id: "asc" }], include: { _count: { select: { recursos: true } } } });
  return materias.map((m) => ({ ...mapGroup(m), course_count: m._count.recursos }));
}

export async function obtenerMateria(a: Actor, materiaId: number) {
  return mapGroup(await materiaVisible(a, materiaId));
}

/** getModulesWithProgress + getModuleRecordings de Roost en una sola consulta */
export async function cursosDeMateria(a: Actor, materiaId: number, alumnoPedido: number | null, incluirLecciones: boolean) {
  await materiaVisible(a, materiaId);
  const alumnoId = esPadre(a.rol) ? alumnoPedido : a.id;
  const recursos = await prisma.recursoCurso.findMany({
    where: {
      materiaId,
      ...(esPadre(a.rol) ? {} : { planes: { some: { alumnoId: a.id } } }),
    },
    orderBy: [{ orden: "asc" }, { id: "asc" }],
    include: {
      lecciones: { orderBy: { orden: "asc" } },
      planes: { where: { alumnoId: alumnoId ?? -1 }, include: { dias: true } },
    },
  });
  return recursos.map((r) => {
    const dias = r.planes.flatMap((p) => p.dias);
    return mapModuleWithProgress(r, r.lecciones, unidadesCubiertas(dias), incluirLecciones);
  });
}

async function recursoVisible(a: Actor, recursoId: number) {
  const recurso = await prisma.recursoCurso.findUnique({ where: { id: recursoId } });
  if (!recurso) throw new NoEncontradoError("Curso no encontrado");
  await materiaVisible(a, recurso.materiaId);
  if (!esPadre(a.rol)) {
    const plan = await prisma.planCurso.findFirst({ where: { alumnoId: a.id, recursoId }, select: { id: true } });
    if (!plan) throw new NoAutorizadoError("No tenés acceso a este curso");
  }
  return recurso;
}

export async function obtenerRecurso(a: Actor, recursoId: number) {
  const recurso = await recursoVisible(a, recursoId);
  return mapModuleWithProgress(recurso, [], new Set(), false);
}

export async function leccionesDeCurso(a: Actor, recursoId: number, alumnoPedido: number | null) {
  await recursoVisible(a, recursoId);
  const alumnoId = esPadre(a.rol) ? alumnoPedido : a.id;
  const [lecciones, dias] = await Promise.all([
    prisma.leccionCurso.findMany({ where: { recursoId }, orderBy: { orden: "asc" } }),
    alumnoId ? prisma.diaLectivo.findMany({ where: { plan: { recursoId, alumnoId } } }) : Promise.resolve([]),
  ]);
  const cubiertas = unidadesCubiertas(dias);
  return lecciones.map((l) => mapRecording(l, cubiertas.has(l.orden)));
}

/** getRecordingById + getAdjacentRecordings */
export async function leccionPorId(a: Actor, leccionId: number) {
  const leccion = await prisma.leccionCurso.findUnique({ where: { id: leccionId } });
  if (!leccion) throw new NoEncontradoError("Lección no encontrada");
  await recursoVisible(a, leccion.recursoId);
  const hermanas = await prisma.leccionCurso.findMany({
    where: { recursoId: leccion.recursoId },
    orderBy: { orden: "asc" },
    select: { id: true, titulo: true, orden: true, videoPlataforma: true, videoId: true },
  });
  const i = hermanas.findIndex((h) => h.id === leccionId);
  const resumen = (h?: (typeof hermanas)[number]) =>
    h ? { id: h.id, title: h.titulo, display_order: h.orden, video_platform: h.videoPlataforma, video_id: h.videoId } : null;
  return { recording: mapRecording(leccion), prev: resumen(hermanas[i - 1]), next: resumen(hermanas[i + 1]) };
}

// ---------- Escritura: materias ----------

export type DatosMateria = {
  nombre: string;
  descripcion?: string | null;
  portadaUrl?: string | null;
  icono?: string | null;
  color?: string | null;
  dificultad?: DificultadTarea;
};

export async function crearMateria(a: Actor, d: DatosMateria) {
  exigirPadre(a);
  const nombre = d.nombre.trim();
  if (!nombre) throw new DatoInvalidoError("Falta el nombre de la materia");
  const orden = (await prisma.materia.aggregate({ _max: { orden: true } }))._max.orden ?? -1;
  return mapGroup(await prisma.materia.create({ data: { ...d, nombre, orden: orden + 1, creadorId: a.id } }));
}

export async function editarMateria(a: Actor, id: number, d: Partial<DatosMateria> & { activa?: boolean }) {
  exigirPadre(a);
  if (d.nombre !== undefined && !d.nombre.trim()) throw new DatoInvalidoError("Falta el nombre de la materia");
  try {
    return mapGroup(await prisma.materia.update({ where: { id }, data: { ...d, nombre: d.nombre?.trim() } }));
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") throw new NoEncontradoError("Materia no encontrada");
    throw e;
  }
}

export async function borrarMateria(a: Actor, id: number) {
  exigirPadre(a);
  const hechos = await prisma.diaLectivo.count({
    where: { plan: { recurso: { materiaId: id } }, estado: { in: ["hecha", "omitida"] } },
  });
  if (hechos > 0) throw new ConflictoError("La materia ya tiene días cumplidos; archivala en vez de borrarla");
  await prisma.materia.delete({ where: { id } }).catch((e) => {
    if ((e as { code?: string }).code === "P2025") throw new NoEncontradoError("Materia no encontrada");
    throw e;
  });
}

// ---------- Escritura: cursos (recursos) ----------

export type DatosRecurso = {
  materiaId: number;
  titulo: string;
  descripcion?: string | null;
  portadaUrl?: string | null;
  tipo: TipoRecurso;
  unidadTipo: UnidadContenido;
  totalUnidades?: number;
  url?: string | null;
  libroId?: number | null;
  minutosPorUnidad?: number;
  umbralAprobacion?: number;
  navegacionLibre?: boolean;
};

export async function crearRecurso(a: Actor, d: DatosRecurso) {
  exigirPadre(a);
  const titulo = d.titulo.trim();
  if (!titulo) throw new DatoInvalidoError("Falta el título del curso");
  const conLecciones = TIPOS_CON_LECCIONES.includes(d.tipo);
  const total = conLecciones ? 0 : d.totalUnidades ?? 0;
  if (!conLecciones && total < 1) throw new DatoInvalidoError("Indicá cuántas unidades tiene");
  if (!(await prisma.materia.findUnique({ where: { id: d.materiaId }, select: { id: true } }))) throw new NoEncontradoError("Materia no encontrada");
  const orden = (await prisma.recursoCurso.aggregate({ where: { materiaId: d.materiaId }, _max: { orden: true } }))._max.orden ?? -1;
  const recurso = await prisma.recursoCurso.create({ data: { ...d, titulo, totalUnidades: total, orden: orden + 1, creadorId: a.id } });
  return mapModuleWithProgress(recurso, [], new Set(), false);
}

export async function editarRecurso(a: Actor, id: number, d: Partial<Omit<DatosRecurso, "materiaId" | "tipo">>) {
  exigirPadre(a);
  const actual = await prisma.recursoCurso.findUnique({ where: { id } });
  if (!actual) throw new NoEncontradoError("Curso no encontrado");
  if (d.titulo !== undefined && !d.titulo.trim()) throw new DatoInvalidoError("Falta el título del curso");
  const data = { ...d, titulo: d.titulo?.trim() };
  // En cursos con lecciones el total sale de las lecciones, no se edita a mano
  if (TIPOS_CON_LECCIONES.includes(actual.tipo)) delete data.totalUnidades;
  else if (data.totalUnidades !== undefined && data.totalUnidades < 1) throw new DatoInvalidoError("Indicá cuántas unidades tiene");
  const recurso = await prisma.recursoCurso.update({ where: { id }, data });
  return mapModuleWithProgress(recurso, [], new Set(), false);
}

export async function borrarRecurso(a: Actor, id: number) {
  exigirPadre(a);
  const hechos = await prisma.diaLectivo.count({ where: { plan: { recursoId: id }, estado: { in: ["hecha", "omitida"] } } });
  if (hechos > 0) throw new ConflictoError("El curso ya tiene días cumplidos; no se puede borrar");
  await prisma.recursoCurso.delete({ where: { id } }).catch((e) => {
    if ((e as { code?: string }).code === "P2025") throw new NoEncontradoError("Curso no encontrado");
    throw e;
  });
}

export async function reordenarRecursos(a: Actor, materiaId: number, idsEnOrden: number[]) {
  exigirPadre(a);
  const existentes = await prisma.recursoCurso.findMany({ where: { materiaId }, select: { id: true } });
  if (idsEnOrden.length !== existentes.length || !existentes.every((e) => idsEnOrden.includes(e.id))) {
    throw new DatoInvalidoError("La lista de cursos no coincide con la de la materia");
  }
  await prisma.$transaction(idsEnOrden.map((id, orden) => prisma.recursoCurso.update({ where: { id }, data: { orden } })));
}

// ---------- Escritura: lecciones ----------

export type DatosLeccion = {
  recursoId: number;
  titulo: string;
  instrucciones?: string | null;
  url?: string | null;
};

/** Video a partir de la URL (HS0); una URL que no es YouTube/Vimeo queda como enlace sin reproductor */
function datosDeVideo(url: string | null | undefined) {
  const limpia = url?.trim() || null;
  const video = limpia ? parsearEnlaceVideo(limpia) : null;
  return {
    url: limpia,
    videoPlataforma: video?.plataforma ?? null,
    videoId: video?.videoId ?? null,
    miniaturaUrl: video?.miniaturaUrl ?? null,
  };
}

/** Mayor unidad cubierta por días hecha/omitida del curso, entre todos los alumnos */
async function maxUnidadCumplida(tx: Tx, recursoId: number) {
  const r = await tx.diaLectivo.aggregate({
    where: { plan: { recursoId }, estado: { in: ["hecha", "omitida"] } },
    _max: { unidadHasta: true },
  });
  return r._max.unidadHasta ?? 0;
}

/** Sincroniza totalUnidades con las lecciones y recalcula los planes activos (regla 8) */
async function sincronizarTotal(tx: Tx, recurso: { id: number; tipo: TipoRecurso }, hoy: string) {
  if (!TIPOS_CON_LECCIONES.includes(recurso.tipo)) return;
  const total = await tx.leccionCurso.count({ where: { recursoId: recurso.id } });
  await tx.recursoCurso.update({ where: { id: recurso.id }, data: { totalUnidades: total } });
  const planes = await tx.planCurso.findMany({ where: { recursoId: recurso.id, estado: "activo" }, select: { id: true } });
  for (const p of planes) await recalcularEn(tx, p.id, hoy);
}

export async function crearLeccion(a: Actor, d: DatosLeccion, hoy: string) {
  exigirPadre(a);
  const titulo = d.titulo.trim();
  if (!titulo) throw new DatoInvalidoError("Falta el título de la lección");
  if (d.url?.trim() && !/^https?:\/\//i.test(d.url.trim())) throw new DatoInvalidoError("El enlace tiene que empezar con http:// o https://");
  return prisma.$transaction(async (tx) => {
    const recurso = await tx.recursoCurso.findUnique({ where: { id: d.recursoId } });
    if (!recurso) throw new NoEncontradoError("Curso no encontrado");
    const orden = ((await tx.leccionCurso.aggregate({ where: { recursoId: d.recursoId }, _max: { orden: true } }))._max.orden ?? 0) + 1;
    const leccion = await tx.leccionCurso.create({
      data: { recursoId: d.recursoId, orden, titulo, instrucciones: d.instrucciones ?? null, creadorId: a.id, ...datosDeVideo(d.url) },
    });
    await sincronizarTotal(tx, recurso, hoy);
    return mapRecording(leccion);
  });
}

export async function editarLeccion(a: Actor, id: number, d: Partial<Omit<DatosLeccion, "recursoId">>) {
  exigirPadre(a);
  if (d.titulo !== undefined && !d.titulo.trim()) throw new DatoInvalidoError("Falta el título de la lección");
  if (d.url?.trim() && !/^https?:\/\//i.test(d.url.trim())) throw new DatoInvalidoError("El enlace tiene que empezar con http:// o https://");
  const data: Prisma.LeccionCursoUpdateInput = {
    ...(d.titulo !== undefined && { titulo: d.titulo.trim() }),
    ...(d.instrucciones !== undefined && { instrucciones: d.instrucciones }),
    ...(d.url !== undefined && datosDeVideo(d.url)),
  };
  try {
    return mapRecording(await prisma.leccionCurso.update({ where: { id }, data }));
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") throw new NoEncontradoError("Lección no encontrada");
    throw e;
  }
}

/**
 * Reescribe `orden` 1..N sin chocar con @@unique([recursoId, orden]): primero valores negativos distintos y después los
 * definitivos. (Sin SQL crudo: las tablas viven en el esquema de la familia y las consultas crudas de Prisma no lo respetan.)
 */
async function renumerar(tx: Tx, recursoId: number, idsEnOrden: number[]) {
  const actuales = await tx.leccionCurso.findMany({ where: { recursoId }, select: { id: true } });
  for (let i = 0; i < actuales.length; i++) await tx.leccionCurso.update({ where: { id: actuales[i].id }, data: { orden: -(i + 1) } });
  for (let i = 0; i < idsEnOrden.length; i++) await tx.leccionCurso.update({ where: { id: idsEnOrden[i] }, data: { orden: i + 1 } });
}

export async function borrarLeccion(a: Actor, id: number, hoy: string) {
  exigirPadre(a);
  await prisma.$transaction(async (tx) => {
    const leccion = await tx.leccionCurso.findUnique({ where: { id }, include: { recurso: true } });
    if (!leccion) throw new NoEncontradoError("Lección no encontrada");
    if (TIPOS_CON_LECCIONES.includes(leccion.recurso.tipo) && (await maxUnidadCumplida(tx, leccion.recursoId)) >= leccion.orden) {
      throw new ConflictoError("Esa lección ya está cubierta por un día cumplido; no se puede borrar");
    }
    await tx.leccionCurso.delete({ where: { id } });
    const restantes = await tx.leccionCurso.findMany({ where: { recursoId: leccion.recursoId }, orderBy: { orden: "asc" }, select: { id: true } });
    await renumerar(tx, leccion.recursoId, restantes.map((l) => l.id));
    await sincronizarTotal(tx, leccion.recurso, hoy);
  });
}

export async function reordenarLecciones(a: Actor, recursoId: number, idsEnOrden: number[]) {
  exigirPadre(a);
  await prisma.$transaction(async (tx) => {
    const actuales = await tx.leccionCurso.findMany({ where: { recursoId }, orderBy: { orden: "asc" }, select: { id: true } });
    if (idsEnOrden.length !== actuales.length || !actuales.every((l) => idsEnOrden.includes(l.id))) {
      throw new DatoInvalidoError("La lista de lecciones no coincide con la del curso");
    }
    const cumplidas = await maxUnidadCumplida(tx, recursoId);
    if (actuales.slice(0, cumplidas).some((l, i) => l.id !== idsEnOrden[i])) {
      throw new ConflictoError("Las lecciones ya cumplidas no se pueden reordenar");
    }
    await renumerar(tx, recursoId, idsEnOrden);
  });
}
