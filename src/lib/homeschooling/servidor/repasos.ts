// Repasos de hoy (máx. 3 mini-preguntas) y su respuesta; la corrección es en el servidor.
import prisma from "../../prisma.ts";
import { aClave, hoyEnFamilia, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { addDays, parseISO, format } from "date-fns";
import { inicioDelDia } from "../dia.ts";
import { responderTarjeta, type TarjetaGuardada } from "./repaso.ts";
import type { PreguntaPublica } from "./quiz.ts";

const MAX_REPASOS_POR_DIA = 3;

export type RepasoHoy = { tarjetaId: number; leccion: { id: number; titulo: string }; materia: string; pregunta: PreguntaPublica };

/** Tarjetas con `proximo` hasta el fin del día en la zona de la familia, no resueltas, con una pregunta de la lección */
export async function repasosDeHoy(alumnoId: number, hoy = hoyEnFamilia()): Promise<RepasoHoy[]> {
  const finDelDia = inicioDelDia(format(addDays(parseISO(hoy), 1), "yyyy-MM-dd"));
  const tarjetas = await prisma.tarjetaRepaso.findMany({
    where: { alumnoId, resuelta: false, proximo: { lt: finDelDia } },
    orderBy: { proximo: "asc" },
    take: MAX_REPASOS_POR_DIA,
    include: {
      leccion: { select: { id: true, titulo: true, recurso: { select: { materia: { select: { nombre: true } } } }, preguntas: { orderBy: { orden: "asc" } } } },
    },
  });
  const salida: RepasoHoy[] = [];
  for (const t of tarjetas) {
    const preguntas = t.leccion.preguntas;
    if (preguntas.length === 0) continue;
    // Rota la pregunta con cada repaso para no repetir siempre la misma
    const reps = (t.tarjeta as { reps?: number } | null)?.reps ?? 0;
    const p = preguntas[reps % preguntas.length];
    salida.push({
      tarjetaId: t.id,
      leccion: { id: t.leccion.id, titulo: t.leccion.titulo },
      materia: t.leccion.recurso.materia.nombre,
      pregunta: { id: p.id, orden: p.orden, segundoVideo: p.segundoVideo, enunciado: p.enunciado, opciones: Array.isArray(p.opciones) ? p.opciones.map(String) : [] },
    });
  }
  return salida;
}

export async function responderRepaso(alumnoId: number, tarjetaId: number, preguntaId: number, elegida: number, ahora = new Date()) {
  const t = await prisma.tarjetaRepaso.findUnique({ where: { id: tarjetaId }, include: { leccion: { select: { preguntas: true } } } });
  if (!t) throw new NoEncontradoError("Repaso no encontrado");
  if (t.alumnoId !== alumnoId) throw new NoAutorizadoError("Ese repaso no es tuyo");
  const p = t.leccion.preguntas.find((x) => x.id === preguntaId);
  if (!p) throw new NoEncontradoError("Pregunta no encontrada");

  const correcta = elegida === p.correcta;
  const r = responderTarjeta(t.tarjeta as unknown as TarjetaGuardada, correcta, ahora);
  await prisma.tarjetaRepaso.update({ where: { id: t.id }, data: { tarjeta: JSON.parse(JSON.stringify(r.tarjeta)), proximo: r.proximo, resuelta: r.resuelta } });
  return { correcta, explicacion: p.explicacion, proximo: aClave(r.proximo), resuelta: r.resuelta };
}
