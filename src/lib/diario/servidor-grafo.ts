// Diario (lane 295), lado servidor: el grafo de enlaces. La privacidad del personal se hace cumplir acá, en cada consulta (como en servidor-enlaces.ts).
// Portado de `buildLinkGraph` y `buildEgoGraph` de vendor/moodiary/packages/feature_base/moodiary_data/lib/src/diary_repository.dart y de las consultas
// `visibleLinkEdges`, `outEdgesOf` e `inEdgesOf` de db/diary.drift (ZhuJHua/moodiary@2c552dd).
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { aClave, NoEncontradoError } from "@/lib/habitos/server";
import type { Actor } from "./etiquetas";
import {
  MAX_ARISTAS_GRAFO,
  MAX_NODOS_LOCAL,
  construirGrafoGeneral,
  ensamblarGrafoLocal,
  expandirNivel,
  profundidadValida,
  type DatosGrafo,
  type EnlaceGrafo,
  type EntradaGrafo,
} from "./grafo";
import type { TipoDiario } from "./reglas";

/** Las entradas que ve quien pide, en un diario. */
const visibles = (actor: Actor, tipo: TipoDiario): Prisma.DiarioEntradaWhereInput => ({ tipo, ...(tipo === "personal" ? { autorId: actor.id } : {}) });

const campos = { id: true, fecha: true, hora: true, titulo: true, texto: true, categoriaId: true } as const;

type Fila = { id: number; fecha: Date; hora: number | null; titulo: string | null; texto: string; categoriaId: number | null };
const aEntrada = (f: Fila): EntradaGrafo => ({ id: f.id, fecha: aClave(f.fecha), hora: f.hora, titulo: f.titulo, texto: f.texto, categoriaId: f.categoriaId });

async function entradasVisibles(donde: Prisma.DiarioEntradaWhereInput, ids: number[]): Promise<EntradaGrafo[]> {
  if (!ids.length) return [];
  const filas = await prisma.diarioEntrada.findMany({ where: { ...donde, id: { in: ids } }, select: campos });
  return filas.map(aEntrada);
}

/**
 * `buildLinkGraph`: todas las entradas del diario que tienen algún enlace, con los enlaces entre ellas. Los más recientes primero, hasta `MAX_ARISTAS_GRAFO`
 * (si hay más, `truncado`).
 */
export async function grafoGeneral(actor: Actor, tipo: TipoDiario): Promise<DatosGrafo> {
  const donde = visibles(actor, tipo);
  const filas = await prisma.diarioEnlace.findMany({
    where: { origen: donde, destino: donde },
    select: { origenId: true, destinoId: true },
    orderBy: [{ origen: { fecha: "desc" } }, { origenId: "desc" }, { destinoId: "desc" }],
    take: MAX_ARISTAS_GRAFO + 1,
  });
  const truncado = filas.length > MAX_ARISTAS_GRAFO;
  const enlaces: EnlaceGrafo[] = filas.slice(0, MAX_ARISTAS_GRAFO);
  const ids = [...new Set(enlaces.flatMap((l) => [l.origenId, l.destinoId]))];
  const grafo = construirGrafoGeneral(await entradasVisibles(donde, ids), enlaces);
  return truncado ? { ...grafo, truncado } : grafo;
}

/**
 * `buildEgoGraph`: la entrada `raizId` y las que la enlazan o enlaza, hasta `profundidad` saltos (1–3) y `MAX_NODOS_LOCAL` nodos. 404 si la entrada no existe
 * o no está disponible en ese diario.
 */
export async function grafoLocal(actor: Actor, tipo: TipoDiario, raizId: number, profundidad: number): Promise<DatosGrafo> {
  const donde = visibles(actor, tipo);
  const raiz = await prisma.diarioEntrada.findFirst({ where: { ...donde, id: raizId }, select: { id: true } });
  if (!raiz) throw new NoEncontradoError("La entrada no existe o no está disponible");
  const saltos = profundidadValida(profundidad);
  const visitados = new Map<number, number>([[raizId, 0]]);
  const candidatas = new Map<string, EnlaceGrafo>();
  let frontera = [raizId];
  for (let nivel = 0; frontera.length; nivel++) {
    const filas = await prisma.diarioEnlace.findMany({
      where: { OR: [{ origenId: { in: frontera } }, { destinoId: { in: frontera } }] },
      select: { origenId: true, destinoId: true },
      take: MAX_ARISTAS_GRAFO,
    });
    frontera = expandirNivel(filas, visitados, candidatas, nivel, saltos, MAX_NODOS_LOCAL);
  }
  const entradas = await entradasVisibles(donde, [...visitados.keys()]);
  return ensamblarGrafoLocal(raizId, visitados, [...candidatas.values()], new Map(entradas.map((e) => [e.id, e])));
}
