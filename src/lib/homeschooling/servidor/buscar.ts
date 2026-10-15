// Propio de Ordo (lane 169, S1): buscador de Estudio. Una consulta, resultados por tipo (materias, cursos, lecciones, material,
// evidencias, actividades) con el enlace a donde abrirlos. El padre busca en todo; un hijo, solo en lo que tiene un plan suyo,
// en su material y en sus propias evidencias y actividades.
import prisma from "../../prisma.ts";
import type { Prisma } from "@prisma/client";
import { esPadre } from "../../habitos/permisos.ts";

export type Actor = { id: number; rol: string };
export type TipoResultado = "materia" | "curso" | "leccion" | "material" | "evidencia" | "actividad";
export type ResultadoBusqueda = { tipo: TipoResultado; id: number; titulo: string; detalle: string | null; href: string };

const RAIZ = "/dashboard/homeschooling";
const POR_TIPO = 5;
export const MIN_CARACTERES = 2;

/** `contains` sin distinguir mayúsculas ni acentos de entrada (la base compara tal cual) */
const tiene = (q: string) => ({ contains: q, mode: "insensitive" as const });

export async function buscarEnEstudio(a: Actor, consulta: string): Promise<ResultadoBusqueda[]> {
  const q = consulta.trim().slice(0, 80);
  if (q.length < MIN_CARACTERES) return [];
  const padre = esPadre(a.rol);
  const conPlan = { planes: { some: { alumnoId: a.id } } };

  const whereMateria: Prisma.MateriaWhereInput = { activa: true, OR: [{ nombre: tiene(q) }, { descripcion: tiene(q) }], ...(padre ? {} : { recursos: { some: conPlan } }) };
  const whereRecurso: Prisma.RecursoCursoWhereInput = { OR: [{ titulo: tiene(q) }, { descripcion: tiene(q) }], ...(padre ? {} : conPlan) };
  const whereLeccion: Prisma.LeccionCursoWhereInput = { OR: [{ titulo: tiene(q) }, { instrucciones: tiene(q) }], ...(padre ? {} : { recurso: conPlan }) };
  const whereMaterial: Prisma.MaterialEstudioWhereInput = {
    OR: [{ titulo: tiene(q) }, { contenido: tiene(q) }],
    ...(padre ? {} : { AND: [{ OR: [{ alumnoId: a.id }, { diaLectivo: { plan: { alumnoId: a.id } } }, { leccion: { recurso: conPlan } }] }] }),
  };
  const whereEvidencia: Prisma.EvidenciaAprendizajeWhereInput = { OR: [{ titulo: tiene(q) }, { nota: tiene(q) }], ...(padre ? {} : { alumnoId: a.id }) };
  const whereActividad: Prisma.ActividadOfflineWhereInput = { OR: [{ titulo: tiene(q) }, { descripcion: tiene(q) }, { lugar: tiene(q) }], ...(padre ? {} : { participantes: { some: { alumnoId: a.id } } }) };

  const [materias, recursos, lecciones, materiales, evidencias, actividades] = await Promise.all([
    prisma.materia.findMany({ where: whereMateria, take: POR_TIPO, orderBy: { nombre: "asc" }, select: { id: true, nombre: true, descripcion: true } }),
    prisma.recursoCurso.findMany({ where: whereRecurso, take: POR_TIPO, orderBy: { titulo: "asc" }, select: { id: true, titulo: true, materiaId: true, materia: { select: { nombre: true } } } }),
    prisma.leccionCurso.findMany({ where: whereLeccion, take: POR_TIPO, orderBy: { titulo: "asc" }, select: { id: true, titulo: true, recursoId: true, recurso: { select: { titulo: true, materiaId: true } } } }),
    prisma.materialEstudio.findMany({
      where: whereMaterial,
      take: POR_TIPO,
      orderBy: { createdAt: "desc" },
      select: { id: true, titulo: true, tipo: true, alumnoId: true, fecha: true, leccion: { select: { id: true, recursoId: true, recurso: { select: { materiaId: true } } } }, diaLectivo: { select: { plan: { select: { alumnoId: true, recursoId: true, recurso: { select: { materiaId: true } } } } } } },
    }),
    prisma.evidenciaAprendizaje.findMany({ where: whereEvidencia, take: POR_TIPO, orderBy: { createdAt: "desc" }, select: { id: true, titulo: true, nota: true, alumno: { select: { nombre: true } } } }),
    prisma.actividadOffline.findMany({ where: whereActividad, take: POR_TIPO, orderBy: { inicio: "desc" }, select: { id: true, titulo: true, lugar: true } }),
  ]);

  const salida: ResultadoBusqueda[] = [];
  for (const m of materias) salida.push({ tipo: "materia", id: m.id, titulo: m.nombre, detalle: m.descripcion, href: `${RAIZ}/materias/${m.id}` });
  for (const r of recursos) salida.push({ tipo: "curso", id: r.id, titulo: r.titulo, detalle: r.materia.nombre, href: `${RAIZ}/materias/${r.materiaId}?module=${r.id}` });
  for (const l of lecciones) salida.push({ tipo: "leccion", id: l.id, titulo: l.titulo, detalle: l.recurso.titulo, href: `${RAIZ}/materias/${l.recurso.materiaId}?module=${l.recursoId}&lesson=${l.id}` });
  for (const m of materiales) {
    const alumno = m.alumnoId ?? m.diaLectivo?.plan.alumnoId ?? null;
    let href = RAIZ;
    if (m.leccion) href = `${RAIZ}/materias/${m.leccion.recurso.materiaId}?module=${m.leccion.recursoId}&lesson=${m.leccion.id}`;
    else if (padre && alumno) href = `${RAIZ}/plan?alumno=${alumno}`;
    salida.push({ tipo: "material", id: m.id, titulo: m.titulo, detalle: m.leccion ? "En una lección" : m.fecha ? `Para el ${m.fecha.toISOString().slice(0, 10)}` : "En un día del plan", href });
  }
  for (const e of evidencias) salida.push({ tipo: "evidencia", id: e.id, titulo: e.titulo || e.nota?.slice(0, 60) || "Evidencia", detalle: padre ? e.alumno.nombre : null, href: `${RAIZ}/portafolio` });
  for (const x of actividades) salida.push({ tipo: "actividad", id: x.id, titulo: x.titulo, detalle: x.lugar, href: `${RAIZ}/horas` });
  return salida;
}
