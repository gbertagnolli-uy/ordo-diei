// Guardia de `POST /api/tasks/[id]/complete` (ARQUITECTURA_DETALLADA §5.5): la Tarea de un día lectivo no se puede
// completar desde el tablero de Tareas sin haber hecho sus lecciones. Una Tarea común cuesta un solo `findUnique`.
import prisma from "../../prisma.ts";
import { motivoGuardia } from "../dia.ts";
import { TIPOS_CON_LECCIONES } from "./progreso.ts";

export async function motivoBloqueoTarea(tareaId: number): Promise<string | null> {
  const dia = await prisma.diaLectivo.findUnique({
    where: { tareaId },
    include: { plan: { include: { recurso: { select: { id: true, tipo: true } } } } },
  });
  if (!dia) return null;

  const conLecciones = TIPOS_CON_LECCIONES.includes(dia.plan.recurso.tipo);
  let leccionesDelRango = 0;
  let leccionesHechas = 0;
  if (conLecciones) {
    const lecciones = await prisma.leccionCurso.findMany({
      where: { recursoId: dia.plan.recurso.id, orden: { gte: dia.unidadDesde, lte: dia.unidadHasta } },
      select: { id: true },
    });
    leccionesDelRango = lecciones.length;
    leccionesHechas = await prisma.progresoLeccion.count({ where: { alumnoId: dia.plan.alumnoId, leccionId: { in: lecciones.map((l) => l.id) } } });
  }
  return motivoGuardia({ diaEstado: dia.estado, conLecciones, leccionesDelRango, leccionesHechas });
}
