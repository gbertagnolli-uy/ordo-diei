// Propio de Ordo (lane 182, K2): el boletín de un hijo por período — notas por materia, asistencia, horas de estudio, actividades,
// lectura y memoria, más el comentario del padre. Todo se calcula con lo que ya está en la app; lo único que se escribe a mano es
// el comentario. Solo padres. Sin valor legal: es el informe de la casa.
import prisma from "../../prisma.ts";
import { aClave, aFecha, hoyEnFamilia, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { asistencia, trimestresDelAnio, validarPeriodo, type PeriodoBase } from "../boletin.ts";
import { armarLibreta, promedioGeneral, type MateriaLibreta } from "../calificaciones.ts";
import { estadoSincronizado } from "../dia.ts";
import { DatoInvalidoError } from "./planes.ts";

export type Actor = { id: number; rol: string };
export type Periodo = PeriodoBase & { id: number };
export type MateriaBoletin = MateriaLibreta & { minutos: number; diasHechos: number; comentarios: string[] };
export type Boletin = {
  periodo: Periodo;
  alumno: { id: number; nombre: string };
  materias: MateriaBoletin[];
  promedio: number | null;
  asistencia: { diasConClase: number; diasHechos: number; porcentaje: number | null };
  minutosEstudio: number;
  actividades: { cantidad: number; minutos: number };
  lectura: { terminados: string[]; paginas: number };
  memoria: { dominadas: string[] };
  comentario: string | null;
};

const exigirPadre = (a: Actor) => {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
};
const aPeriodo = (p: { id: number; nombre: string; inicio: Date; fin: Date }): Periodo => ({ id: p.id, nombre: p.nombre, inicio: aClave(p.inicio), fin: aClave(p.fin) });

export async function listarPeriodos(a: Actor): Promise<Periodo[]> {
  exigirPadre(a);
  return (await prisma.periodoCalificacion.findMany({ orderBy: { inicio: "asc" } })).map(aPeriodo);
}

export async function crearPeriodo(a: Actor, d: PeriodoBase): Promise<Periodo> {
  exigirPadre(a);
  const error = validarPeriodo(d);
  if (error) throw new DatoInvalidoError(error);
  return aPeriodo(await prisma.periodoCalificacion.create({ data: { nombre: d.nombre.trim().slice(0, 80), inicio: aFecha(d.inicio), fin: aFecha(d.fin) } }));
}

/** Crea los tres trimestres de un año (salta los que ya existen con el mismo inicio) */
export async function crearTrimestres(a: Actor, anio: number): Promise<number> {
  exigirPadre(a);
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) throw new DatoInvalidoError("Año no válido");
  let creados = 0;
  for (const p of trimestresDelAnio(anio)) {
    const existe = await prisma.periodoCalificacion.findFirst({ where: { inicio: aFecha(p.inicio) }, select: { id: true } });
    if (existe) continue;
    await prisma.periodoCalificacion.create({ data: { nombre: p.nombre, inicio: aFecha(p.inicio), fin: aFecha(p.fin) } });
    creados += 1;
  }
  return creados;
}

export async function editarPeriodo(a: Actor, id: number, d: PeriodoBase): Promise<Periodo> {
  exigirPadre(a);
  const error = validarPeriodo(d);
  if (error) throw new DatoInvalidoError(error);
  const { count } = await prisma.periodoCalificacion.updateMany({ where: { id }, data: { nombre: d.nombre.trim().slice(0, 80), inicio: aFecha(d.inicio), fin: aFecha(d.fin) } });
  if (count === 0) throw new NoEncontradoError("Período no encontrado");
  return aPeriodo((await prisma.periodoCalificacion.findUniqueOrThrow({ where: { id } })));
}

export async function borrarPeriodo(a: Actor, id: number): Promise<void> {
  exigirPadre(a);
  const { count } = await prisma.periodoCalificacion.deleteMany({ where: { id } });
  if (count === 0) throw new NoEncontradoError("Período no encontrado");
}

export async function guardarComentarioBoletin(a: Actor, periodoId: number, alumnoId: number, comentario: string | null): Promise<void> {
  exigirPadre(a);
  const texto = comentario?.trim() || null;
  if ((texto ?? "").length > 2000) throw new DatoInvalidoError("El comentario es demasiado largo (máximo 2000 caracteres)");
  if (!(await prisma.periodoCalificacion.findUnique({ where: { id: periodoId }, select: { id: true } }))) throw new NoEncontradoError("Período no encontrado");
  await prisma.boletinAlumno.upsert({ where: { periodoId_alumnoId: { periodoId, alumnoId } }, create: { periodoId, alumnoId, comentario: texto }, update: { comentario: texto } });
}

export async function armarBoletin(a: Actor, alumnoId: number, periodoId: number, hoy = hoyEnFamilia()): Promise<Boletin> {
  exigirPadre(a);
  const [periodoDb, alumno] = await Promise.all([
    prisma.periodoCalificacion.findUnique({ where: { id: periodoId } }),
    prisma.usuario.findUnique({ where: { id: alumnoId }, select: { id: true, nombre: true, rolFamiliar: true } }),
  ]);
  if (!periodoDb) throw new NoEncontradoError("Período no encontrado");
  if (!alumno || (alumno.rolFamiliar !== "Hijo" && alumno.rolFamiliar !== "Hija")) throw new NoEncontradoError("Alumno no encontrado");
  const periodo = aPeriodo(periodoDb);
  const rango = { gte: periodoDb.inicio, lte: periodoDb.fin };
  const hasta = periodo.fin < hoy ? periodo.fin : hoy; // los días que todavía no llegaron no cuentan como faltas

  const [notas, dias, actividades, libros, sesiones, memoria, boletin] = await Promise.all([
    prisma.calificacion.findMany({ where: { alumnoId, fecha: rango }, orderBy: [{ fecha: "desc" }, { id: "desc" }], include: { materia: { select: { nombre: true, color: true } } } }),
    prisma.diaLectivo.findMany({
      where: { fecha: { gte: periodoDb.inicio, lte: aFecha(hasta) }, estado: { in: ["pendiente", "hecha"] }, plan: { alumnoId } },
      select: { fecha: true, estado: true, unidadDesde: true, unidadHasta: true, tarea: { select: { estado: true } }, plan: { select: { recurso: { select: { minutosPorUnidad: true, materiaId: true, materia: { select: { nombre: true, color: true } } } } } } },
    }),
    prisma.actividadOffline.findMany({ where: { inicio: { gte: periodoDb.inicio, lt: new Date(periodoDb.fin.getTime() + 86_400_000) }, participantes: { some: { alumnoId } } }, select: { inicio: true, fin: true } }),
    prisma.lecturaLibro.findMany({ where: { alumnoId, estado: "leido", terminadoEn: rango }, select: { titulo: true } }),
    prisma.sesionLectura.aggregate({ where: { alumnoId, fecha: rango }, _sum: { paginas: true } }),
    prisma.memorizacion.findMany({ where: { alumnoId, dominada: true, ultimoEn: { gte: periodoDb.inicio, lt: new Date(periodoDb.fin.getTime() + 86_400_000) } }, select: { titulo: true } }),
    prisma.boletinAlumno.findUnique({ where: { periodoId_alumnoId: { periodoId, alumnoId } }, select: { comentario: true } }),
  ]);

  // Días de clase reales (con el estado de su Tarea) por materia
  const hechos = dias.filter((d) => estadoSincronizado(d.estado, d.tarea?.estado ?? null) === "hecha");
  const porMateria = new Map<number, { nombre: string; color: string | null; minutos: number; diasHechos: number }>();
  for (const d of hechos) {
    const r = d.plan.recurso;
    const g = porMateria.get(r.materiaId) ?? { nombre: r.materia.nombre, color: r.materia.color, minutos: 0, diasHechos: 0 };
    g.minutos += (d.unidadHasta - d.unidadDesde + 1) * r.minutosPorUnidad;
    g.diasHechos += 1;
    porMateria.set(r.materiaId, g);
  }
  const libreta = armarLibreta(
    notas.map((n) => ({ id: n.id, fecha: aClave(n.fecha), titulo: n.titulo, tipo: n.tipo, puntaje: n.puntaje, comentario: n.comentario, diaLectivoId: n.diaLectivoId, materiaId: n.materiaId, materia: n.materia.nombre, color: n.materia.color })),
    [...porMateria.entries()].map(([id, g]) => ({ id, nombre: g.nombre, color: g.color }))
  );
  const materias: MateriaBoletin[] = libreta.map((m) => ({ ...m, minutos: porMateria.get(m.materiaId)?.minutos ?? 0, diasHechos: porMateria.get(m.materiaId)?.diasHechos ?? 0, comentarios: m.notas.filter((n) => n.comentario).slice(0, 3).map((n) => n.comentario as string) }));

  const fechasConClase = new Set(dias.map((d) => aClave(d.fecha)));
  const fechasHechas = new Set(hechos.map((d) => aClave(d.fecha)));
  return {
    periodo,
    alumno: { id: alumno.id, nombre: alumno.nombre },
    materias,
    promedio: promedioGeneral(libreta),
    asistencia: { diasConClase: fechasConClase.size, diasHechos: fechasHechas.size, porcentaje: asistencia(fechasConClase.size, fechasHechas.size) },
    minutosEstudio: materias.reduce((n, m) => n + m.minutos, 0),
    actividades: { cantidad: actividades.length, minutos: actividades.reduce((n, x) => n + Math.max(0, Math.round((x.fin.getTime() - x.inicio.getTime()) / 60_000)), 0) },
    lectura: { terminados: libros.map((l) => l.titulo), paginas: sesiones._sum.paginas ?? 0 },
    memoria: { dominadas: memoria.map((m) => m.titulo) },
    comentario: boletin?.comentario ?? null,
  };
}
