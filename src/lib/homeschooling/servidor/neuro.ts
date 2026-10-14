// Preferencias del alumno e historias sociales (H6). El padre configura todo; el propio alumno solo puede activar o apagar
// su modo relajado. Las historias son de los padres; el niño solo ve las que le "mostraron hoy" y se marcan vistas.
import prisma from "../../prisma.ts";
import { aClave, aFecha, hoyEnFamilia, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { errorDePasos, normalizarPasos, type PasoHistoria } from "../neuro.ts";
import { DatoInvalidoError } from "./planes.ts";

export type Actor = { id: number; rol: string };
export type Preferencia = { modoRelajado: boolean; primeroDespues: boolean; recompensaDespues: string | null };

const POR_DEFECTO: Preferencia = { modoRelajado: false, primeroDespues: false, recompensaDespues: null };

export async function obtenerPreferencia(a: Actor, alumnoId: number): Promise<Preferencia> {
  const id = esPadre(a.rol) ? alumnoId : a.id;
  const p = await prisma.preferenciaAlumno.findUnique({ where: { alumnoId: id } });
  return p ? { modoRelajado: p.modoRelajado, primeroDespues: p.primeroDespues, recompensaDespues: p.recompensaDespues } : POR_DEFECTO;
}

export async function guardarPreferencia(a: Actor, alumnoId: number, cambios: Partial<Preferencia>): Promise<Preferencia> {
  let datos: Partial<Preferencia> = cambios;
  let id = alumnoId;
  if (!esPadre(a.rol)) {
    // El alumno solo puede cambiar su propio modo relajado
    if (alumnoId !== a.id) throw new NoAutorizadoError("Solo podés cambiar tus preferencias");
    id = a.id;
    datos = cambios.modoRelajado === undefined ? {} : { modoRelajado: cambios.modoRelajado };
    if (Object.keys(cambios).some((k) => k !== "modoRelajado")) throw new NoAutorizadoError("Eso lo cambian tus padres");
  }
  if (datos.recompensaDespues !== undefined && datos.recompensaDespues !== null) datos.recompensaDespues = datos.recompensaDespues.trim().slice(0, 120) || null;
  if (!(await prisma.usuario.findUnique({ where: { id }, select: { id: true } }))) throw new NoEncontradoError("Alumno no encontrado");
  const p = await prisma.preferenciaAlumno.upsert({ where: { alumnoId: id }, create: { alumnoId: id, ...datos }, update: datos });
  return { modoRelajado: p.modoRelajado, primeroDespues: p.primeroDespues, recompensaDespues: p.recompensaDespues };
}

// ---------- Historias sociales ----------

export type HistoriaVista = { id: number; alumnoId: number | null; titulo: string; pasos: PasoHistoria[]; mostrarEl: string | null; vistaEn: string | null };

const aVista = (h: { id: number; alumnoId: number | null; titulo: string; pasos: unknown; mostrarEl: Date | null; vistaEn: Date | null }): HistoriaVista => ({
  id: h.id,
  alumnoId: h.alumnoId,
  titulo: h.titulo,
  pasos: normalizarPasos(Array.isArray(h.pasos) ? (h.pasos as { texto?: unknown; icono?: unknown }[]) : []),
  mostrarEl: h.mostrarEl ? aClave(h.mostrarEl) : null,
  vistaEn: h.vistaEn ? h.vistaEn.toISOString() : null,
});

const exigirPadre = (a: Actor) => {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
};

function validarHistoria(titulo: string, pasos: { texto?: unknown; icono?: unknown }[]) {
  if (!titulo.trim()) throw new DatoInvalidoError("Falta el título de la historia");
  const error = errorDePasos(pasos);
  if (error) throw new DatoInvalidoError(error);
}

/** Biblioteca del padre: las historias sin alumno (plantillas propias) */
export async function listarHistorias(a: Actor): Promise<HistoriaVista[]> {
  exigirPadre(a);
  const filas = await prisma.historiaSocial.findMany({ where: { alumnoId: null }, orderBy: { createdAt: "desc" } });
  return filas.map(aVista);
}

export async function crearHistoria(a: Actor, d: { titulo: string; pasos: { texto?: unknown; icono?: unknown }[] }): Promise<HistoriaVista> {
  exigirPadre(a);
  validarHistoria(d.titulo, d.pasos);
  return aVista(await prisma.historiaSocial.create({ data: { titulo: d.titulo.trim(), pasos: normalizarPasos(d.pasos), alumnoId: null } }));
}

export async function editarHistoria(a: Actor, id: number, d: { titulo: string; pasos: { texto?: unknown; icono?: unknown }[] }): Promise<HistoriaVista> {
  exigirPadre(a);
  validarHistoria(d.titulo, d.pasos);
  try {
    return aVista(await prisma.historiaSocial.update({ where: { id }, data: { titulo: d.titulo.trim(), pasos: normalizarPasos(d.pasos) } }));
  } catch (e) {
    if ((e as { code?: string }).code === "P2025") throw new NoEncontradoError("Historia no encontrada");
    throw e;
  }
}

export async function borrarHistoria(a: Actor, id: number) {
  exigirPadre(a);
  const r = await prisma.historiaSocial.deleteMany({ where: { id } });
  if (r.count === 0) throw new NoEncontradoError("Historia no encontrada");
}

/** «Mostrar hoy»: copia la historia de la biblioteca a cada alumno, para que le aparezca arriba de «Hoy aprendo» */
export async function mostrarHoy(a: Actor, historiaId: number, alumnoIds: number[], hoy = hoyEnFamilia()) {
  exigirPadre(a);
  const h = await prisma.historiaSocial.findUnique({ where: { id: historiaId } });
  if (!h) throw new NoEncontradoError("Historia no encontrada");
  const ids = [...new Set(alumnoIds)];
  if (ids.length === 0) throw new DatoInvalidoError("Elegí al menos un alumno");
  if ((await prisma.usuario.count({ where: { id: { in: ids } } })) !== ids.length) throw new NoEncontradoError("Algún alumno no existe");
  await prisma.historiaSocial.createMany({
    data: ids.map((alumnoId) => ({ alumnoId, titulo: h.titulo, pasos: h.pasos as object, mostrarEl: aFecha(hoy) })),
  });
  return { ok: true, alumnos: ids.length };
}

/** Las que le mostraron al alumno hasta hoy y todavía no vio */
export async function historiasPendientes(alumnoId: number, hoy = hoyEnFamilia()): Promise<HistoriaVista[]> {
  const filas = await prisma.historiaSocial.findMany({
    where: { alumnoId, vistaEn: null, mostrarEl: { lte: aFecha(hoy) } },
    orderBy: { createdAt: "asc" },
  });
  return filas.map(aVista);
}

export async function marcarVista(a: Actor, id: number) {
  const h = await prisma.historiaSocial.findUnique({ where: { id } });
  if (!h) throw new NoEncontradoError("Historia no encontrada");
  if (h.alumnoId !== a.id && !esPadre(a.rol)) throw new NoAutorizadoError("Esa historia no es tuya");
  await prisma.historiaSocial.update({ where: { id }, data: { vistaEn: new Date() } });
  return { ok: true };
}
