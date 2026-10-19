// Conducta diaria (vault/LANE_205_CONDUCTA_DIARIA.md): los padres marcan un nivel por hijo y por día;
// el hijo y los padres lo ven en el perfil y en el resumen de los hijos.
import { desbloquearCofresDePadres } from "../engagement/servidor.ts";
import { HORA_COFRE } from "../comportamiento/cofre.ts";
import { horaEnFamilia, otorgarCofreDelDia } from "../comportamiento/server.ts";
import { avisoCofre } from "../push/avisos.ts";
import { enviarAviso } from "../push/servidor.ts";
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import prisma from "../prisma.ts";
import { esPadre } from "../habitos/permisos.ts";
import { NoAutorizadoError, NoEncontradoError } from "../habitos/server.ts";
import { APP_TZ } from "../cartas/eventos.ts";
import { esFechaDia, esNivelConducta, etiquetaConducta, MAX_NOTA_CONDUCTA, promedioConducta } from "./niveles.ts";

export type DiaConducta = { fecha: string; nivel: number; nota: string | null };
export type ResumenConducta = {
  /** Promedio de los días registrados en la ventana, null si no hay ninguno */
  promedio: number | null;
  registrados: number;
  dias: number;
  /** Del más viejo al más nuevo; los días sin registro no aparecen */
  registros: DiaConducta[];
  /** Lo que escribieron los padres (notas del día, evaluaciones de premios y penitencias), lo más nuevo primero */
  anotaciones: Anotacion[];
};

export type Anotacion = { clave: string; fecha: string; tipo: "nota" | "premio" | "penitencia"; titulo: string; texto: string };

export const hoyDia = (ahora: Date = new Date()) => format(ahora, "yyyy-MM-dd", { in: tz(APP_TZ) });
const aFecha = (dia: string) => new Date(`${dia}T00:00:00Z`);

export async function registrarConducta(
  actor: { id: number; rol?: string },
  datos: { usuarioId?: unknown; nivel?: unknown; nota?: unknown; fecha?: unknown }
): Promise<DiaConducta> {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden registrar la conducta");
  const usuarioId = Number(datos.usuarioId);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) throw new Error("Elegí a quién registrar");
  if (!esNivelConducta(datos.nivel)) throw new Error("El nivel de conducta debe ser de 1 a 5");
  const dia = datos.fecha == null || datos.fecha === "" ? hoyDia() : datos.fecha;
  if (!esFechaDia(dia)) throw new Error("La fecha no es válida");
  if (dia > hoyDia()) throw new Error("No se puede registrar la conducta de un día futuro");
  const nota = typeof datos.nota === "string" ? datos.nota.trim() : "";
  if (nota.length > MAX_NOTA_CONDUCTA) throw new Error(`La nota admite hasta ${MAX_NOTA_CONDUCTA} caracteres`);

  const hijo = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { rolFamiliar: true } });
  if (!hijo) throw new NoEncontradoError("No existe ese miembro");

  const fila = await prisma.conductaDia.upsert({
    where: { usuarioId_fecha: { usuarioId, fecha: aFecha(dia) } },
    create: { usuarioId, registradoPorId: actor.id, fecha: aFecha(dia), nivel: datos.nivel, nota: nota || null },
    update: { registradoPorId: actor.id, nivel: datos.nivel, nota: nota || null },
  });
  if (dia === hoyDia()) {
    const ahora = new Date();
    const otorgado = await otorgarCofreDelDia(usuarioId, ahora).catch((e) => {
      console.error("[CofreHijo]", e);
      return false;
    });
    if (otorgado && horaEnFamilia(ahora) >= HORA_COFRE) {
      await enviarAviso(usuarioId, avisoCofre(), { ahora }).catch((e) => console.error("[PushCofre]", e));
    }
    await desbloquearCofresDePadres(ahora).catch((e) => console.error("[CofresPadres]", e));
  }
  return { fecha: dia, nivel: fila.nivel, nota: fila.nota };
}

/** Conducta de un miembro en los últimos `dias` días (hoy incluido). */
export async function resumenConducta(usuarioId: number, dias = 30): Promise<ResumenConducta> {
  const desde = new Date(aFecha(hoyDia()).getTime() - (dias - 1) * 86_400_000);
  const filas = await prisma.conductaDia.findMany({
    where: { usuarioId, fecha: { gte: desde } },
    orderBy: { fecha: "asc" },
    select: { fecha: true, nivel: true, nota: true },
  });
  const desdeInstante = new Date(desde.getTime() - 3 * 3_600_000); // los comportamientos llevan hora
  const comportamientos = await prisma.comportamiento.findMany({
    where: { usuarioId, createdAt: { gte: desdeInstante } },
    orderBy: { createdAt: "desc" },
    select: { id: true, tipo: true, titulo: true, evaluacion: true, penitencia: true, createdAt: true },
  });
  const anotaciones: Anotacion[] = [
    ...filas.filter((f) => f.nota).map((f) => ({ clave: `n${f.fecha.toISOString()}`, fecha: f.fecha.toISOString().slice(0, 10), tipo: "nota" as const, titulo: `Conducta: ${etiquetaConducta(f.nivel)}`, texto: f.nota! })),
    ...comportamientos.flatMap((c) => {
      const base = { fecha: format(c.createdAt, "yyyy-MM-dd", { in: tz(APP_TZ) }), titulo: c.titulo };
      return [
        ...(c.evaluacion ? [{ clave: `e${c.id}`, ...base, tipo: (c.tipo === "Negativo" ? "penitencia" : "premio") as Anotacion["tipo"], texto: c.evaluacion }] : []),
        ...(c.penitencia ? [{ clave: `p${c.id}`, ...base, tipo: "penitencia" as const, texto: `Penitencia: ${c.penitencia}` }] : []),
      ];
    }),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const registros = filas.map((f) => ({ fecha: f.fecha.toISOString().slice(0, 10), nivel: f.nivel, nota: f.nota }));
  return { promedio: promedioConducta(registros.map((r) => r.nivel)), registrados: registros.length, dias, registros, anotaciones };
}

/** Lo registrado para un día de varios hijos (para precargar el selector). */
export async function conductaDelDia(usuarioId: number, dia: string): Promise<DiaConducta | null> {
  if (!esFechaDia(dia)) return null;
  const f = await prisma.conductaDia.findUnique({ where: { usuarioId_fecha: { usuarioId, fecha: aFecha(dia) } } });
  return f ? { fecha: dia, nivel: f.nivel, nota: f.nota } : null;
}
