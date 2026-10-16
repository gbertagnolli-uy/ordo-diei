// Resumen de los hijos para los padres (vault/LANE_205_CONDUCTA_DIARIA.md): por cada hijo, conducta,
// rendimiento, pendientes y tareas en una sola mirada. Solo lectura.
import { startOfWeek } from "date-fns";
import prisma from "../prisma.ts";
import { esPadre } from "../habitos/permisos.ts";
import { getEstadosHabitos, NoAutorizadoError } from "../habitos/server.ts";
import { inicioDelDiaEnTz } from "../cartas/eventos.ts";
import { resumenConducta, type ResumenConducta } from "./server.ts";

const ABIERTAS = ["Pendiente", "En_progreso", "Pausada", "Vencida"] as const;
const MAX_TAREAS = 8;

export type TareaResumen = { id: number; titulo: string; estado: string; fechaVencimiento: string | null; dificultad: string };

export type ResumenHijo = {
  id: number;
  nombre: string;
  fotoUrl: string | null;
  puntos: number;
  racha: number;
  tareasCompletadasTotal: number;
  /** % de cumplimiento que ya calcula la app */
  cumplimiento: number;
  conducta: ResumenConducta;
  tareas: {
    abiertas: number;
    vencidas: number;
    paraHoy: number;
    esperandoAprobacion: number;
    completadasSemana: number;
    proximas: TareaResumen[];
  };
  habitos: { activos: number; constanciaPromedio: number | null };
};

export async function resumenDeLosHijos(rol?: string): Promise<ResumenHijo[]> {
  if (!esPadre(rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden ver el resumen de los hijos");
  const hijos = await prisma.usuario.findMany({
    where: { rolFamiliar: { in: ["Hijo", "Hija"] } },
    select: { id: true, nombre: true, fotoUrl: true, availablePoints: true, streakDays: true, totalTasksCompleted: true, completionPercentage: true },
    orderBy: { nombre: "asc" },
  });
  if (hijos.length === 0) return [];

  const ids = hijos.map((h) => h.id);
  const hoy = inicioDelDiaEnTz();
  const finDeHoy = new Date(hoy.getTime() + 86_400_000);
  const lunes = startOfWeek(hoy, { weekStartsOn: 1 });

  const [abiertas, esperando, completadas, habitos, conductas] = await Promise.all([
    prisma.tarea.findMany({
      where: { asignadoId: { in: ids }, estado: { in: [...ABIERTAS] } },
      select: { id: true, asignadoId: true, titulo: true, estado: true, fechaVencimiento: true, dificultad: true },
      orderBy: [{ fechaVencimiento: { sort: "asc", nulls: "last" } }, { id: "asc" }],
    }),
    prisma.tarea.groupBy({ by: ["asignadoId"], where: { asignadoId: { in: ids }, estado: "Esperando_Aprobacion" }, _count: true }),
    prisma.tarea.groupBy({
      by: ["asignadoId"],
      where: { asignadoId: { in: ids }, estado: { in: ["Completada", "Aprobada"] }, fechaCompletado: { gte: lunes } },
      _count: true,
    }),
    getEstadosHabitos(ids),
    Promise.all(ids.map((id) => resumenConducta(id, 30))),
  ]);

  return hijos.map((h, i) => {
    const suyas = abiertas.filter((t) => t.asignadoId === h.id);
    const constancias = habitos.find((e) => e.usuarioId === h.id)?.habitos.map((x) => x.constancia) ?? [];
    return {
      id: h.id,
      nombre: h.nombre,
      fotoUrl: h.fotoUrl,
      puntos: h.availablePoints,
      racha: h.streakDays,
      tareasCompletadasTotal: h.totalTasksCompleted,
      cumplimiento: Math.round(h.completionPercentage),
      conducta: conductas[i],
      tareas: {
        abiertas: suyas.length,
        vencidas: suyas.filter((t) => t.estado === "Vencida").length,
        paraHoy: suyas.filter((t) => t.fechaVencimiento && t.fechaVencimiento < finDeHoy).length,
        esperandoAprobacion: esperando.find((e) => e.asignadoId === h.id)?._count ?? 0,
        completadasSemana: completadas.find((e) => e.asignadoId === h.id)?._count ?? 0,
        proximas: suyas.slice(0, MAX_TAREAS).map((t) => ({
          id: t.id,
          titulo: t.titulo,
          estado: t.estado,
          fechaVencimiento: t.fechaVencimiento?.toISOString() ?? null,
          dificultad: t.dificultad,
        })),
      },
      habitos: {
        activos: constancias.length,
        constanciaPromedio: constancias.length ? Math.round((constancias.reduce((a, c) => a + c, 0) / constancias.length) * 100) : null,
      },
    };
  });
}
