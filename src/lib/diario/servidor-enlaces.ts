// Diario (lane 290), lado servidor: enlaces entre entradas. La privacidad del personal se hace cumplir acá, en cada consulta.
// Portado de `_applyLinks`, `getBacklinks` y `getForwardLinks` de vendor/moodiary/packages/feature_base/moodiary_data/lib/src/diary_repository.dart
// y de la lista de candidatas de vendor/moodiary/editor/src/core/editor/nodes/diary-link.ts (ZhuJHua/moodiary@2c552dd).
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { aClave, NoEncontradoError } from "@/lib/habitos/server";
import { MAX_CANDIDATAS, coincide, prepararConsulta, puntuar } from "./busqueda";
import type { NodoDoc } from "./contenido";
import { MAX_CANDIDATAS_ENLACE, MAX_ENLACES_PANEL, idsDeEnlaces, rotuloDeEntrada, type CandidatoEnlace, type ResumenEnlace } from "./enlaces";
import type { Actor } from "./etiquetas";
import type { TipoDiario } from "./reglas";

/** Las entradas que ve quien pide, en un diario. */
const visibles = (actor: Actor, tipo: TipoDiario): Prisma.DiarioEntradaWhereInput => ({ tipo, ...(tipo === "personal" ? { autorId: actor.id } : {}) });

/**
 * moodiary `_applyLinks`: reescribe los enlaces de una entrada. Solo cuentan los que apuntan a una entrada del mismo diario
 * (en el personal, del mismo autor); el resto queda en el texto, pero no en la tabla.
 */
export async function aplicarEnlaces(tx: Prisma.TransactionClient, origenId: number, tipo: TipoDiario, autorId: number, contenido: NodoDoc | null): Promise<void> {
  await tx.diarioEnlace.deleteMany({ where: { origenId } });
  const ids = contenido ? idsDeEnlaces(contenido, origenId) : [];
  if (!ids.length) return;
  const existentes = await tx.diarioEntrada.findMany({ where: { id: { in: ids }, tipo, ...(tipo === "personal" ? { autorId } : {}) }, select: { id: true } });
  if (!existentes.length) return;
  await tx.diarioEnlace.createMany({ data: existentes.map((e) => ({ origenId, destinoId: e.id })) });
}

/** Lo que ofrece la lista al escribir `[[`: con texto, las que coinciden (mejor puntaje primero); sin texto, las más recientes. */
export async function candidatosDeEnlace(actor: Actor, tipo: TipoDiario, consulta: string, excluirId: number | null): Promise<CandidatoEnlace[]> {
  const q = prepararConsulta(consulta);
  const conTexto = q.terminos.length > 0;
  const filas = await prisma.diarioEntrada.findMany({
    where: { ...visibles(actor, tipo), ...(excluirId ? { id: { not: excluirId } } : {}) },
    select: { id: true, fecha: true, titulo: true, texto: true },
    orderBy: [{ fecha: "desc" }, { creadaEn: "desc" }],
    take: conTexto ? MAX_CANDIDATAS : MAX_CANDIDATAS_ENLACE,
  });
  const base = conTexto ? filas.filter((f) => coincide(f.titulo, f.texto, q)) : filas;
  const ordenadas = conTexto ? [...base].sort((a, b) => puntuar(b.titulo, b.texto, q) - puntuar(a.titulo, a.texto, q)) : base;
  return ordenadas.slice(0, MAX_CANDIDATAS_ENLACE).map((f) => ({ id: String(f.id), label: rotuloDeEntrada(f.titulo, f.texto), detalle: aClave(f.fecha) }));
}

export interface EnlacesDeEntrada {
  entrada: ResumenEnlace;
  salientes: ResumenEnlace[];
  entrantes: ResumenEnlace[];
}

const resumen = (e: { id: number; fecha: Date; titulo: string | null; texto: string }): ResumenEnlace => ({ id: e.id, fecha: aClave(e.fecha), rotulo: rotuloDeEntrada(e.titulo, e.texto) });
const campos = { id: true, fecha: true, titulo: true, texto: true } as const;

/** La entrada (si está disponible en ese diario) con sus enlaces salientes y entrantes, la más reciente primero. */
export async function enlacesDeEntrada(actor: Actor, tipo: TipoDiario, id: number): Promise<EnlacesDeEntrada> {
  const donde = visibles(actor, tipo);
  const e = await prisma.diarioEntrada.findFirst({ where: { id, ...donde }, select: campos });
  if (!e) throw new NoEncontradoError("La entrada no existe o no está disponible");
  const [salientes, entrantes] = await Promise.all([
    prisma.diarioEnlace.findMany({ where: { origenId: id, destino: donde }, select: { destino: { select: campos } }, take: MAX_ENLACES_PANEL }),
    prisma.diarioEnlace.findMany({ where: { destinoId: id, origen: donde }, select: { origen: { select: campos } }, take: MAX_ENLACES_PANEL }),
  ]);
  const masNueva = (a: ResumenEnlace, b: ResumenEnlace) => b.fecha.localeCompare(a.fecha) || b.id - a.id;
  return {
    entrada: resumen(e),
    salientes: salientes.map((s) => resumen(s.destino)).sort(masNueva),
    entrantes: entrantes.map((s) => resumen(s.origen)).sort(masNueva),
  };
}
