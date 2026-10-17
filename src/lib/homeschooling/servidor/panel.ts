// Datos del panel del padre: qué toca hoy a cada hijo, qué está atrasado y el avance de cada curso por materia.
import prisma from "../../prisma.ts";
import { aFecha, hoyEnFamilia } from "../../habitos/server.ts";
import { estadoSincronizado } from "../dia.ts";
import { alumnosDeFamilia } from "./vistas.ts";

export type ClaseHoy = { curso: string; materia: string; color: string | null; estado: string };
export type HoyAlumno = { alumnoId: number; nombre: string; fotoUrl: string | null; clases: ClaseHoy[]; atrasadas: number };
export type MateriaPanel = {
  id: number;
  nombre: string;
  icono: string | null;
  color: string | null;
  portadaUrl: string | null;
  cursos: {
    id: number;
    titulo: string;
    tipo: string;
    porcentaje: number;
    alumnos: number;
    lecciones: number;
    materiales: number;
    quizzes: number;
  }[];
};

export async function resumenPanel(hoy = hoyEnFamilia()): Promise<{ hoy: HoyAlumno[]; materias: MateriaPanel[]; archivadas: { id: number; nombre: string }[] }> {
  const [alumnos, deHoy, atrasados, materias, archivadas] = await Promise.all([
    alumnosDeFamilia(),
    prisma.diaLectivo.findMany({
      where: { fecha: aFecha(hoy), plan: { estado: "activo" }, estado: { in: ["pendiente", "hecha", "omitida"] } },
      include: {
        tarea: { select: { estado: true } },
        plan: { select: { alumnoId: true, recurso: { select: { titulo: true, materia: { select: { nombre: true, color: true } } } } } },
      },
    }),
    prisma.diaLectivo.findMany({ where: { fecha: { lt: aFecha(hoy) }, estado: "pendiente", plan: { estado: "activo" } }, select: { plan: { select: { alumnoId: true } }, tarea: { select: { estado: true } } } }),
    prisma.materia.findMany({
      where: { activa: true },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: {
        recursos: {
          orderBy: [{ orden: "asc" }, { id: "asc" }],
          include: {
            planes: { where: { estado: "activo" }, include: { dias: { select: { estado: true, unidadDesde: true, unidadHasta: true } } } },
            _count: { select: { lecciones: true } },
            lecciones: { select: { id: true, _count: { select: { materiales: true, preguntas: true } } } },
          },
        },
      },
    }),
    prisma.materia.findMany({ where: { activa: false }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const hoyPorAlumno: HoyAlumno[] = alumnos.map((a) => ({
    alumnoId: a.id,
    nombre: a.nombre,
    fotoUrl: a.fotoUrl,
    clases: deHoy
      .filter((d) => d.plan.alumnoId === a.id)
      .map((d) => ({ curso: d.plan.recurso.titulo, materia: d.plan.recurso.materia.nombre, color: d.plan.recurso.materia.color, estado: estadoSincronizado(d.estado, d.tarea?.estado ?? null) })),
    // Un día pasado cuya Tarea ya se completó no cuenta como atrasado aunque todavía no se haya sincronizado
    atrasadas: atrasados.filter((d) => d.plan.alumnoId === a.id && estadoSincronizado("pendiente", d.tarea?.estado ?? null) === "pendiente").length,
  }));

  const panel: MateriaPanel[] = materias.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    icono: m.icono,
    color: m.color,
    portadaUrl: m.portadaUrl,
    cursos: m.recursos.map((r) => {
      const hechas = r.planes.reduce(
        (n, p) => n + p.dias.filter((d) => d.estado === "hecha" || d.estado === "omitida").reduce((k, d) => k + d.unidadHasta - d.unidadDesde + 1, 0),
        0
      );
      const total = r.totalUnidades * r.planes.length;
      const materialesLecciones = r.lecciones.reduce((acc, l) => acc + l._count.materiales, 0);
      const quizzesLecciones = r.lecciones.filter((l) => l._count.preguntas > 0).length;
      return {
        id: r.id,
        titulo: r.titulo,
        tipo: r.tipo,
        porcentaje: total > 0 ? Math.min(100, Math.round((hechas / total) * 100)) : 0,
        alumnos: r.planes.length,
        lecciones: r._count.lecciones,
        materiales: materialesLecciones,
        quizzes: quizzesLecciones,
      };
    }),
  }));

  return { hoy: hoyPorAlumno, materias: panel, archivadas };
}

