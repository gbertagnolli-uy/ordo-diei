// Diario (lane 297), lado servidor: las huellas (cuántas entradas tiene cada lugar y de cuándo a cuándo) y las entradas de un lugar.
// Portado de vendor/moodiary/packages/feature_base/moodiary_data/lib/src/diary_repository.dart (`placeFootprints`, `getDiariesAtPlace`) (ZhuJHua/moodiary@2c552dd).
// Personal = solo las entradas del propio usuario; familiar = las de toda la familia (igual que el resto del diario).
import prisma from "@/lib/prisma";
import { aClave } from "@/lib/habitos/server";
import type { Actor } from "./etiquetas";
import type { TipoDiario } from "./reglas";
import { aVista, incluir, type EntradaVista } from "./servidor";
import { verificarLugar } from "./servidor-lugares";

/** Tope de entradas que se devuelven de un lugar (el mapa muestra la cantidad total aparte). */
export const MAX_ENTRADAS_LUGAR = 1000;

export type HuellaVista = {
  lugarId: number;
  cantidad: number;
  /** Día de la entrada más vieja y de la más nueva, «YYYY-MM-DD». */
  primera: string;
  ultima: string;
};

const dueno = (actor: Actor, tipo: TipoDiario) => ({ tipo, ...(tipo === "personal" ? { autorId: actor.id } : {}) });

/** moodiary `placeFootprints`: por lugar, cuántas entradas tiene y de qué fecha a qué fecha. Solo aparecen los lugares con al menos una entrada. */
export async function huellasDeLugares(actor: Actor, tipo: TipoDiario): Promise<HuellaVista[]> {
  const filas = await prisma.diarioEntrada.groupBy({
    by: ["lugarId"],
    where: { ...dueno(actor, tipo), lugarId: { not: null } },
    _count: { _all: true },
    _min: { fecha: true },
    _max: { fecha: true },
  });
  return filas.flatMap((f) =>
    f.lugarId === null || !f._min.fecha || !f._max.fecha ? [] : [{ lugarId: f.lugarId, cantidad: f._count._all, primera: aClave(f._min.fecha), ultima: aClave(f._max.fecha) }],
  );
}

/** moodiary `getDiariesAtPlace`: las entradas de un lugar, las más nuevas primero. El lugar tiene que ser del ámbito del actor. */
export async function entradasDeLugar(actor: Actor, tipo: TipoDiario, lugarId: number): Promise<EntradaVista[]> {
  await verificarLugar(prisma, actor, tipo, lugarId);
  const filas = await prisma.diarioEntrada.findMany({
    where: { ...dueno(actor, tipo), lugarId },
    orderBy: [{ fecha: "desc" }, { creadaEn: "desc" }],
    take: MAX_ENTRADAS_LUGAR,
    include: incluir,
  });
  return filas
    .map((e) => aVista(e, actor))
    .sort((a, b) => (a.fecha === b.fecha ? b.hora - a.hora || b.creadaEn.localeCompare(a.creadaEn) : b.fecha.localeCompare(a.fecha)));
}
