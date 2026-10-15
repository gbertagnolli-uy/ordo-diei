// Planes de curso y días lectivos (Prisma). Solo Padre/Madre. `hoy` entra siempre como parámetro
// ('YYYY-MM-DD'; las rutas pasan hoyEnFamilia()). Reglas: ARQUITECTURA_DETALLADA §4.
import { getISODay, parseISO } from "date-fns";
import prisma from "../../prisma.ts";
import type { Prisma } from "@prisma/client";
import { aClave, aFecha, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { repartir, type SalidaPacing, type UnidadTipo } from "../pacing.ts";
import { planearRecalculo, type DiaPlan } from "../recalculo.ts";
import { expandirDiasSinClase, MAX_DIAS_TOTAL, validarRango as validarRangoVacaciones, type FiestaElegida, type RangoVacaciones } from "../anioEscolar.ts";

export class ConflictoError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
    this.name = "Conflicto";
  }
}

export class DatoInvalidoError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "DatoInvalido";
  }
}

type Tx = Prisma.TransactionClient;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fechaValida = (c: string) => FECHA.test(c) && aClave(aFecha(c)) === c;

function validarRango(inicio: string, fin: string, diasSemana: number[]) {
  if (!fechaValida(inicio) || !fechaValida(fin)) throw new DatoInvalidoError("Fechas no válidas");
  if (inicio > fin) throw new DatoInvalidoError("La fecha de inicio es posterior a la de fin");
  if (diasSemana.length === 0 || !diasSemana.every((d) => Number.isInteger(d) && d >= 1 && d <= 7)) {
    throw new DatoInvalidoError("Días de la semana no válidos (1=lunes … 7=domingo)");
  }
}

async function exigirPadre(actorId: number) {
  const u = await prisma.usuario.findUnique({ where: { id: actorId }, select: { rolFamiliar: true } });
  if (!esPadre(u?.rolFamiliar)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
}

const noLectivosDe = async (db: Tx | typeof prisma, alumnoId: number) =>
  (await db.diaNoLectivo.findMany({ where: { alumnoId }, select: { fecha: true } })).map((n) => aClave(n.fecha));

export type DatosPlan = { recursoId: number; alumnoId: number; inicio: string; fin: string; diasSemana: number[] };

export async function vistaPrevia(
  datos: DatosPlan & { noLectivosExtra?: string[] }
): Promise<SalidaPacing> {
  validarRango(datos.inicio, datos.fin, datos.diasSemana);
  const recurso = await prisma.recursoCurso.findUnique({ where: { id: datos.recursoId } });
  if (!recurso) throw new NoEncontradoError("Recurso no encontrado");
  const noLectivos = [...(await noLectivosDe(prisma, datos.alumnoId)), ...(datos.noLectivosExtra ?? [])];
  return repartir({
    totalUnidades: recurso.totalUnidades,
    unidadesBase: 0,
    desde: datos.inicio,
    hasta: datos.fin,
    diasSemana: datos.diasSemana,
    noLectivos,
    unidadTipo: recurso.unidadTipo as UnidadTipo,
  });
}

export async function crearPlan(datos: DatosPlan & { actorId: number }) {
  await exigirPadre(datos.actorId);
  validarRango(datos.inicio, datos.fin, datos.diasSemana);
  const [recurso, alumno, existente] = await Promise.all([
    prisma.recursoCurso.findUnique({ where: { id: datos.recursoId } }),
    prisma.usuario.findUnique({ where: { id: datos.alumnoId }, select: { id: true } }),
    prisma.planCurso.findUnique({ where: { recursoId_alumnoId: { recursoId: datos.recursoId, alumnoId: datos.alumnoId } } }),
  ]);
  if (!recurso) throw new NoEncontradoError("Recurso no encontrado");
  if (!alumno) throw new NoEncontradoError("Alumno no encontrado");
  if (existente) throw new ConflictoError("Ese alumno ya tiene un plan para este recurso");

  const pacing = repartir({
    totalUnidades: recurso.totalUnidades,
    unidadesBase: 0,
    desde: datos.inicio,
    hasta: datos.fin,
    diasSemana: datos.diasSemana,
    noLectivos: await noLectivosDe(prisma, datos.alumnoId),
    unidadTipo: recurso.unidadTipo as UnidadTipo,
  });
  if (pacing.aviso?.tipo === "sin_dias") throw new DatoInvalidoError("No hay días lectivos en ese rango");

  try {
    const plan = await prisma.$transaction(async (tx) => {
      const p = await tx.planCurso.create({
        data: {
          recursoId: datos.recursoId,
          alumnoId: datos.alumnoId,
          inicio: aFecha(datos.inicio),
          fin: aFecha(datos.fin),
          diasSemana: [...new Set(datos.diasSemana)].sort(),
        },
      });
      await tx.diaLectivo.createMany({
        data: pacing.dias.map((d) => ({
          planId: p.id,
          fecha: aFecha(d.fecha),
          unidadDesde: d.unidadDesde,
          unidadHasta: d.unidadHasta,
        })),
      });
      return p;
    });
    return { plan, dias: pacing.dias.length, aviso: pacing.aviso ?? null };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") throw new ConflictoError("Ese alumno ya tiene un plan para este recurso");
    throw err;
  }
}

/** Carga un plan y arma la entrada de `planearRecalculo` (sin escribir nada) */
async function entradaDePlan(db: Tx | typeof prisma, planId: number, hoy: string, noLectivosExtra: string[] = []) {
  const plan = await db.planCurso.findUnique({
    where: { id: planId },
    include: { recurso: true, dias: { include: { tarea: { select: { estado: true } } } } },
  });
  if (!plan) throw new NoEncontradoError("Plan no encontrado");
  const dias: DiaPlan[] = plan.dias.map((d) => ({
    id: d.id,
    fecha: aClave(d.fecha),
    unidadDesde: d.unidadDesde,
    unidadHasta: d.unidadHasta,
    estado: d.estado,
    tareaEstado: d.tarea?.estado ?? null,
  }));
  const entrada = {
    dias,
    hoy,
    inicio: aClave(plan.inicio),
    fin: aClave(plan.fin),
    diasSemana: plan.diasSemana,
    totalUnidades: plan.recurso.totalUnidades,
    unidadTipo: plan.recurso.unidadTipo as UnidadTipo,
    noLectivosAlumno: [...(await noLectivosDe(db, plan.alumnoId)), ...noLectivosExtra],
  };
  return { plan, entrada };
}

/** Aplica `planearRecalculo` a un plan dentro de una transacción. `fin` nunca cambia. */
export async function recalcularEn(tx: Tx, planId: number, hoy: string) {
  const { plan, entrada } = await entradaDePlan(tx, planId, hoy);
  if (plan.estado !== "activo") return null;
  const r = planearRecalculo(entrada);

  if (r.marcarHechas.length) {
    await tx.diaLectivo.updateMany({ where: { id: { in: r.marcarHechas } }, data: { estado: "hecha" } });
  }
  if (r.mover.length) {
    await tx.diaLectivo.updateMany({ where: { id: { in: r.mover } }, data: { estado: "movida" } });
  }
  if (r.borrar.length) {
    const tareaIds = plan.dias.filter((d) => r.borrar.includes(d.id) && d.tareaId).map((d) => d.tareaId as number);
    await tx.diaLectivo.deleteMany({ where: { id: { in: r.borrar } } });
    if (tareaIds.length) await tx.tarea.deleteMany({ where: { id: { in: tareaIds }, estado: "Pendiente" } });
  }
  if (r.pacing.dias.length) {
    await tx.diaLectivo.createMany({
      data: r.pacing.dias.map((d) => ({
        planId,
        fecha: aFecha(d.fecha),
        unidadDesde: d.unidadDesde,
        unidadHasta: d.unidadHasta,
      })),
    });
  }
  return { base: r.base, huecos: r.huecos, creados: r.pacing.dias.length, aviso: r.pacing.aviso ?? null };
}

export const recalcular = (planId: number, hoy: string) => prisma.$transaction((tx) => recalcularEn(tx, planId, hoy));

export async function marcarNoLectivo(datos: { actorId: number; alumnoIds: number[]; fecha: string; motivo: string; hoy: string }) {
  await exigirPadre(datos.actorId);
  if (!fechaValida(datos.fecha)) throw new DatoInvalidoError("Fecha no válida");
  const alumnoIds = [...new Set(datos.alumnoIds)];
  if (alumnoIds.length === 0) throw new DatoInvalidoError("Falta el alumno");
  const motivo = datos.motivo.trim() || "Sin clase";
  const existentes = await prisma.usuario.count({ where: { id: { in: alumnoIds } } });
  if (existentes !== alumnoIds.length) throw new NoEncontradoError("Alumno no encontrado");

  return prisma.$transaction(async (tx) => {
    for (const alumnoId of alumnoIds) {
      await tx.diaNoLectivo.upsert({
        where: { alumnoId_fecha: { alumnoId, fecha: aFecha(datos.fecha) } },
        create: { alumnoId, fecha: aFecha(datos.fecha), motivo },
        update: { motivo },
      });
    }
    const planes = await tx.planCurso.findMany({ where: { alumnoId: { in: alumnoIds }, estado: "activo" }, select: { id: true } });
    const recalculados = [];
    for (const p of planes) recalculados.push({ planId: p.id, ...(await recalcularEn(tx, p.id, datos.hoy)) });
    return { alumnos: alumnoIds.length, recalculados };
  });
}

/** Día pendiente sin empezar: sin Tarea o con la Tarea todavía `Pendiente` */
async function cargarDiaEditable(tx: Tx, diaId: number) {
  const dia = await tx.diaLectivo.findUnique({ where: { id: diaId }, include: { plan: true, tarea: { select: { id: true, estado: true } } } });
  if (!dia) throw new NoEncontradoError("Día no encontrado");
  if (dia.estado !== "pendiente") throw new ConflictoError("Solo se puede cambiar un día pendiente");
  if (dia.tarea && dia.tarea.estado !== "Pendiente") throw new ConflictoError("Ese día ya empezó");
  return dia;
}

export async function moverDia(datos: { actorId: number; diaId: number; fecha: string; hoy: string }) {
  await exigirPadre(datos.actorId);
  if (!fechaValida(datos.fecha)) throw new DatoInvalidoError("Fecha no válida");
  return prisma.$transaction(async (tx) => {
    const dia = await cargarDiaEditable(tx, datos.diaId);
    const { plan } = dia;
    const nueva = datos.fecha;
    if (nueva < datos.hoy) throw new DatoInvalidoError("No se puede mover a una fecha pasada");
    if (nueva < aClave(plan.inicio) || nueva > aClave(plan.fin)) throw new DatoInvalidoError("Fuera del rango del plan");
    if (!plan.diasSemana.includes(getISODay(parseISO(nueva)))) throw new DatoInvalidoError("Ese día de la semana no es lectivo en el plan");
    if ((await noLectivosDe(tx, plan.alumnoId)).includes(nueva)) throw new ConflictoError("Ese día está marcado sin clase");

    const otros = await tx.diaLectivo.findMany({ where: { planId: plan.id, id: { not: dia.id }, estado: { not: "movida" } } });
    if (otros.some((o) => aClave(o.fecha) === nueva)) throw new ConflictoError("Ya hay un día lectivo en esa fecha");
    const anteriores = otros.filter((o) => o.unidadHasta < dia.unidadDesde).map((o) => aClave(o.fecha));
    const siguientes = otros.filter((o) => o.unidadDesde > dia.unidadHasta).map((o) => aClave(o.fecha));
    const previa = anteriores.length ? anteriores.reduce((a, b) => (a > b ? a : b)) : null;
    const proxima = siguientes.length ? siguientes.reduce((a, b) => (a < b ? a : b)) : null;
    if ((previa && nueva <= previa) || (proxima && nueva >= proxima)) {
      throw new ConflictoError("Tiene que quedar entre el día anterior y el siguiente");
    }

    if (dia.tarea) await tx.tarea.deleteMany({ where: { id: dia.tarea.id, estado: "Pendiente" } });
    return tx.diaLectivo.update({ where: { id: dia.id }, data: { fecha: aFecha(nueva), tareaId: null } });
  });
}

export async function omitirDia(datos: { actorId: number; diaId: number }) {
  await exigirPadre(datos.actorId);
  return prisma.$transaction(async (tx) => {
    const dia = await cargarDiaEditable(tx, datos.diaId);
    if (dia.tarea) await tx.tarea.deleteMany({ where: { id: dia.tarea.id, estado: "Pendiente" } });
    return tx.diaLectivo.update({ where: { id: dia.id }, data: { estado: "omitida", tareaId: null } });
  });
}

// ---------- Días sin clase: vista previa, listado y baja ----------

/** «Antes/después» de marcar un día sin clase, por cada plan activo de los alumnos (no escribe) */
export async function vistaNoLectivo(datos: { actorId: number; alumnoIds: number[]; fecha: string; hoy: string }) {
  await exigirPadre(datos.actorId);
  if (!fechaValida(datos.fecha)) throw new DatoInvalidoError("Fecha no válida");
  const planes = await prisma.planCurso.findMany({
    where: { alumnoId: { in: datos.alumnoIds }, estado: "activo" },
    include: { recurso: { select: { titulo: true } }, alumno: { select: { nombre: true } } },
  });
  const resumen = (r: ReturnType<typeof planearRecalculo>) => ({
    dias: r.pacing.dias.length,
    promedio: r.pacing.promedio,
    ultimoDia: r.pacing.dias.at(-1)?.fecha ?? null,
    aviso: r.pacing.aviso?.tipo ?? null,
  });
  const salida = [];
  for (const p of planes) {
    const antes = planearRecalculo((await entradaDePlan(prisma, p.id, datos.hoy)).entrada);
    const despues = planearRecalculo((await entradaDePlan(prisma, p.id, datos.hoy, [datos.fecha])).entrada);
    salida.push({
      planId: p.id,
      alumno: p.alumno.nombre,
      curso: p.recurso.titulo,
      fin: aClave(p.fin),
      antes: resumen(antes),
      despues: resumen(despues),
    });
  }
  return salida;
}

export async function listarNoLectivos(actorId: number) {
  await exigirPadre(actorId);
  const filas = await prisma.diaNoLectivo.findMany({
    orderBy: [{ fecha: "desc" }, { alumnoId: "asc" }],
    take: 300,
    include: { alumno: { select: { nombre: true } } },
  });
  return filas.map((f) => ({ id: f.id, alumnoId: f.alumnoId, alumno: f.alumno.nombre, fecha: aClave(f.fecha), motivo: f.motivo }));
}

export async function quitarNoLectivo(datos: { actorId: number; id: number; hoy: string }) {
  await exigirPadre(datos.actorId);
  return prisma.$transaction(async (tx) => {
    const fila = await tx.diaNoLectivo.findUnique({ where: { id: datos.id } });
    if (!fila) throw new NoEncontradoError("Día sin clase no encontrado");
    await tx.diaNoLectivo.delete({ where: { id: fila.id } });
    const planes = await tx.planCurso.findMany({ where: { alumnoId: fila.alumnoId, estado: "activo" }, select: { id: true } });
    for (const p of planes) await recalcularEn(tx, p.id, datos.hoy);
    return { ok: true };
  });
}

// ---------- Gestión de un plan ya creado ----------

export type CambiosPlan = { estado?: "activo" | "pausado" | "finalizado"; fin?: string; diasSemana?: number[] };

/**
 * Pausa, reanuda o termina un plan, o cambia su fecha de fin y sus días de la semana. Si el plan queda activo, se recalcula:
 * lo no hecho se vuelve a repartir desde hoy hasta la nueva fecha de fin.
 */
export async function cambiarPlan(actor: { id: number }, planId: number, c: CambiosPlan, hoy: string) {
  await exigirPadre(actor.id);
  return prisma.$transaction(async (tx) => {
    const plan = await tx.planCurso.findUnique({ where: { id: planId } });
    if (!plan) throw new NoEncontradoError("Plan no encontrado");
    const fin = c.fin ?? aClave(plan.fin);
    const diasSemana = c.diasSemana ?? plan.diasSemana;
    validarRango(aClave(plan.inicio), fin, diasSemana);
    if (c.fin !== undefined && fin < hoy) throw new DatoInvalidoError("La fecha de fin no puede ser anterior a hoy");

    const estado = c.estado ?? plan.estado;
    await tx.planCurso.update({ where: { id: planId }, data: { estado, fin: aFecha(fin), diasSemana: [...new Set(diasSemana)].sort() } });
    // Reanudar o cambiar fechas/días de un plan activo: se reparte de nuevo lo que falta
    const resultado = estado === "activo" ? await recalcularEn(tx, planId, hoy) : null;
    return { ok: true, estado, recalculo: resultado };
  });
}

/** Quita un plan que todavía no tiene días cumplidos; borra las Tareas del plan que sigan `Pendiente` */
export async function quitarPlan(actor: { id: number }, planId: number) {
  await exigirPadre(actor.id);
  await prisma.$transaction(async (tx) => {
    const plan = await tx.planCurso.findUnique({ where: { id: planId }, include: { dias: { select: { estado: true, tareaId: true } } } });
    if (!plan) throw new NoEncontradoError("Plan no encontrado");
    if (plan.dias.some((d) => d.estado === "hecha" || d.estado === "omitida")) {
      throw new ConflictoError("Ese plan ya tiene días cumplidos; pausalo o terminalo en vez de quitarlo");
    }
    const tareaIds = plan.dias.map((d) => d.tareaId).filter((id): id is number => id !== null);
    await tx.planCurso.delete({ where: { id: planId } });
    if (tareaIds.length) await tx.tarea.deleteMany({ where: { id: { in: tareaIds }, estado: "Pendiente" } });
  });
}

// ---------- «Ponerse al día» (lane 171, R1) ----------
// El reparto ya se recalcula solo cuando el alumno abre «Hoy». Esto le da al padre el control: ver cuánto se atrasó cada
// plan, qué pasaría al repartirlo de nuevo y, si el reparto no entra antes del fin, con qué fecha de fin sí entraría.

export type PlanAtrasado = {
  planId: number;
  curso: string;
  materia: string;
  atrasadas: number;
  fin: string;
  /** Cómo quedaría el reparto de lo que falta, hasta el fin actual */
  despues: { dias: number; promedio: number; ultimoDia: string | null; aviso: "sin_dias" | "sobrecarga" | null };
  /** Si el fin actual no alcanza para repartir bien: el primer fin (hasta 8 semanas más) con el que sí */
  finSugerido: string | null;
};

const sumarDias = (clave: string, n: number) => aClave(new Date(aFecha(clave).getTime() + n * 86_400_000));

export async function vistaPonerseAlDia(actorId: number, alumnoId: number, hoy: string): Promise<PlanAtrasado[]> {
  await exigirPadre(actorId);
  const planes = await prisma.planCurso.findMany({
    where: { alumnoId, estado: "activo" },
    include: { recurso: { select: { titulo: true, materia: { select: { nombre: true } } } } },
    orderBy: { fin: "asc" },
  });
  const salida: PlanAtrasado[] = [];
  for (const p of planes) {
    const { entrada } = await entradaDePlan(prisma, p.id, hoy);
    const r = planearRecalculo(entrada);
    if (r.mover.length === 0) continue;
    let finSugerido: string | null = null;
    if (r.pacing.aviso) {
      for (let semanas = 1; semanas <= 8 && !finSugerido; semanas++) {
        const fin = sumarDias(entrada.fin, 7 * semanas);
        if (!planearRecalculo({ ...entrada, fin }).pacing.aviso) finSugerido = fin;
      }
    }
    salida.push({
      planId: p.id,
      curso: p.recurso.titulo,
      materia: p.recurso.materia.nombre,
      atrasadas: r.mover.length,
      fin: aClave(p.fin),
      despues: { dias: r.pacing.dias.length, promedio: r.pacing.promedio, ultimoDia: r.pacing.dias.at(-1)?.fecha ?? null, aviso: r.pacing.aviso?.tipo ?? null },
      finSugerido,
    });
  }
  return salida;
}

/** Reparte lo atrasado desde hoy en todos los planes activos del alumno. `extender` = { planId: nuevo fin } para los que se alargan */
export async function ponerseAlDia(actorId: number, alumnoId: number, hoy: string, extender: Record<number, string> = {}) {
  await exigirPadre(actorId);
  const pendientes = await vistaPonerseAlDia(actorId, alumnoId, hoy);
  if (pendientes.length === 0) return { planes: 0, dias: 0 };
  let dias = 0;
  for (const p of pendientes) {
    const fin = extender[p.planId];
    if (fin !== undefined && (!fechaValida(fin) || fin < p.fin)) throw new DatoInvalidoError("La nueva fecha de fin no es válida");
    const r = await prisma.$transaction(async (tx) => {
      if (fin !== undefined && fin !== p.fin) await tx.planCurso.update({ where: { id: p.planId }, data: { fin: aFecha(fin) } });
      return recalcularEn(tx, p.planId, hoy);
    });
    dias += r?.creados ?? 0;
  }
  return { planes: pendientes.length, dias };
}

// ---------- «Configurar el año» (lane 197, C9) ----------

export type ConfigAnio = {
  actorId: number;
  alumnoIds: number[];
  vacaciones: RangoVacaciones[];
  fiestas: FiestaElegida[];
  hoy: string;
};

/** Marca de una vez las vacaciones y las fiestas como días sin clase de varios hijos y reparte de nuevo cada plan activo (una sola vez) */
export async function configurarAnio(d: ConfigAnio) {
  await exigirPadre(d.actorId);
  const alumnoIds = [...new Set(d.alumnoIds)];
  if (alumnoIds.length === 0) throw new DatoInvalidoError("Elegí al menos un hijo");
  for (const r of d.vacaciones) {
    const error = validarRangoVacaciones(r);
    if (error) throw new DatoInvalidoError(error);
  }
  for (const f of d.fiestas) if (!fechaValida(f.fecha)) throw new DatoInvalidoError("Fecha de fiesta no válida");
  const dias = expandirDiasSinClase(d.vacaciones, d.fiestas);
  if (dias.length === 0) throw new DatoInvalidoError("No hay días sin clase para marcar");
  if (dias.length > MAX_DIAS_TOTAL) throw new DatoInvalidoError(`Son demasiados días (máximo ${MAX_DIAS_TOTAL})`);
  if ((await prisma.usuario.count({ where: { id: { in: alumnoIds }, rolFamiliar: { in: ["Hijo", "Hija"] } } })) !== alumnoIds.length) throw new NoEncontradoError("Alumno no encontrado");

  return prisma.$transaction(
    async (tx) => {
      const r = await tx.diaNoLectivo.createMany({
        data: alumnoIds.flatMap((alumnoId) => dias.map((x) => ({ alumnoId, fecha: aFecha(x.fecha), motivo: x.motivo }))),
        skipDuplicates: true,
      });
      const planes = await tx.planCurso.findMany({ where: { alumnoId: { in: alumnoIds }, estado: "activo" }, select: { id: true } });
      for (const p of planes) await recalcularEn(tx, p.id, d.hoy);
      return { dias: dias.length, marcados: r.count, planesRepartidos: planes.length };
    },
    { timeout: 60_000 }
  );
}
