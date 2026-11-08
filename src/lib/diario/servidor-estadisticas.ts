// Diario (lane 287), lado servidor: la lista liviana de entradas sobre la que el navegador calcula las estadísticas (E1).
// Visibilidad igual que la búsqueda: el personal solo muestra las entradas del autor; el familiar, las de toda la familia.
import prisma from "@/lib/prisma";
import { aClave } from "@/lib/habitos/server";
import { imagenesDe, type NodoDoc } from "./contenido";
import type { Actor } from "./etiquetas";
import { MAX_FILAS, contarPalabras, type FilaEstadistica } from "./estadisticas";
import type { TipoDiario } from "./reglas";
import { minutosEnFamilia } from "./servidor";

export interface DatosEstadisticas {
  filas: FilaEstadistica[];
  /** Había más de `MAX_FILAS` entradas: se cuentan las más recientes. */
  truncado: boolean;
}

const TANDA = 2000;

export async function filasEstadisticas(actor: Actor, tipo: TipoDiario): Promise<DatosEstadisticas> {
  const donde = { tipo, ...(tipo === "personal" ? { autorId: actor.id } : {}) };
  const filas: FilaEstadistica[] = [];
  let cursor: number | undefined;
  // Por tandas: el documento de cada entrada puede pesar y no hace falta tenerlos todos en memoria a la vez
  while (filas.length <= MAX_FILAS) {
    const tanda = await prisma.diarioEntrada.findMany({
      where: donde,
      orderBy: { id: "desc" },
      take: TANDA,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        fecha: true,
        hora: true,
        creadaEn: true,
        animo: true,
        texto: true,
        contenido: true,
        categoriaId: true,
        _count: { select: { fotos: true } },
        etiquetas: { select: { etiquetaId: true, valor: true } },
      },
    });
    for (const e of tanda) {
      filas.push({
        id: e.id,
        fecha: aClave(e.fecha),
        hora: e.hora ?? minutosEnFamilia(e.creadaEn),
        animo: e.animo,
        palabras: contarPalabras(e.texto),
        fotos: e._count.fotos + (e.contenido ? imagenesDe(e.contenido as unknown as NodoDoc).length : 0),
        categoriaId: e.categoriaId,
        etiquetas: e.etiquetas.map((t) => ({ id: t.etiquetaId, valor: t.valor })),
      });
    }
    if (tanda.length < TANDA) break;
    cursor = tanda[tanda.length - 1].id;
  }
  const truncado = filas.length > MAX_FILAS;
  return { filas: truncado ? filas.slice(0, MAX_FILAS) : filas, truncado };
}
