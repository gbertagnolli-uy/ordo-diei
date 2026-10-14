// Lecturas para las páginas servidor de Homeschooling (alumnos, planes por curso, días del plan).
import prisma from "../../prisma.ts";
import { aClave } from "../../habitos/server.ts";

export type AlumnoVista = { id: number; nombre: string; fotoUrl: string | null };

export async function alumnosDeFamilia(): Promise<AlumnoVista[]> {
  return prisma.usuario.findMany({
    where: { rolFamiliar: { in: ["Hijo", "Hija"] } },
    select: { id: true, nombre: true, fotoUrl: true },
    orderBy: { nombre: "asc" },
  });
}

/** Plan de cada alumno por curso de una materia (para «Asignar a…» y el detalle del curso) */
export async function planesPorCurso(materiaId: number) {
  const planes = await prisma.planCurso.findMany({
    where: { recurso: { materiaId } },
    include: { alumno: { select: { nombre: true } } },
    orderBy: { inicio: "asc" },
  });
  const salida: Record<number, { alumnoId: number; nombre: string; inicio: string; fin: string }[]> = {};
  for (const p of planes) {
    (salida[p.recursoId] ??= []).push({ alumnoId: p.alumnoId, nombre: p.alumno.nombre, inicio: aClave(p.inicio), fin: aClave(p.fin) });
  }
  return salida;
}

export async function diasDelAlumno(alumnoId: number) {
  const dias = await prisma.diaLectivo.findMany({
    where: { plan: { alumnoId } },
    orderBy: { fecha: "asc" },
    include: {
      tarea: { select: { estado: true } },
      plan: { include: { recurso: { select: { titulo: true, unidadTipo: true, materia: { select: { nombre: true, color: true } } } } } },
    },
  });
  return dias.map((d) => ({
    id: d.id,
    fecha: aClave(d.fecha),
    unidadDesde: d.unidadDesde,
    unidadHasta: d.unidadHasta,
    estado: d.estado,
    tareaEstado: d.tarea?.estado ?? null,
    curso: d.plan.recurso.titulo,
    materia: d.plan.recurso.materia.nombre,
    materiaColor: d.plan.recurso.materia.color,
    unidadTipo: d.plan.recurso.unidadTipo as string,
  }));
}

export async function noLectivosDelAlumno(alumnoId: number) {
  const filas = await prisma.diaNoLectivo.findMany({ where: { alumnoId }, orderBy: { fecha: "asc" } });
  return filas.map((f) => ({ id: f.id, fecha: aClave(f.fecha), motivo: f.motivo }));
}
