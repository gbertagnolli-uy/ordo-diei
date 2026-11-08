// Diario (lane 286), lado servidor: plantillas. Personal = solo del creador; familiar = de toda la familia (las edita su creador o un padre).
// Portado de vendor/Daily_You/lib/providers/templates_provider.dart, lib/database/{template,template_tag}_dao.dart (Demizo/Daily_You@7cc237d).
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { NoAutorizadoError, NoEncontradoError } from "@/lib/habitos/server";
import type { NodoDoc } from "./contenido";
import { puedeEditarCatalogo, type Actor } from "./etiquetas";
import { MAX_PLANTILLAS_AMBITO, SEMILLA_PLANTILLAS, validarPlantilla } from "./plantillas";
import type { TipoDiario } from "./reglas";

type Db = Prisma.TransactionClient;

export type PlantillaVista = {
  id: number;
  nombre: string;
  texto: string;
  /** Cuerpo como documento (null = plantilla vacía). */
  contenido: NodoDoc | null;
  /** Etiquetas que se ponen al usarla. */
  etiquetas: number[];
  predeterminada: boolean;
  puedoEditar: boolean;
};

const CLAVE_SIEMBRA = "plantillas";

const alcance = (actor: Actor, tipo: TipoDiario) => ({ ambito: tipo, ...(tipo === "personal" ? { creadorId: actor.id } : {}) });

const aJson = (d: NodoDoc) => d as unknown as Prisma.InputJsonObject;

/** Daily You crea las plantillas de ejemplo una sola vez. Acá, una vez por ámbito (por persona en el personal). */
async function sembrar(actor: Actor, tipo: TipoDiario): Promise<void> {
  const duenoId = tipo === "personal" ? actor.id : 0;
  const clave = { ambito_duenoId_clave: { ambito: tipo, duenoId, clave: CLAVE_SIEMBRA } };
  if (await prisma.diarioSembrado.findUnique({ where: clave })) return;
  const creadorId = tipo === "personal" ? actor.id : null;
  try {
    await prisma.$transaction(async (tx) => {
      // Si dos pedidos llegan a la vez, el segundo choca con el índice único y no siembra de nuevo
      await tx.diarioSembrado.create({ data: { ambito: tipo, duenoId, clave: CLAVE_SIEMBRA } });
      await tx.diarioPlantilla.createMany({
        data: SEMILLA_PLANTILLAS.map((s) => ({ ambito: tipo, creadorId, nombre: s.nombre, texto: validarPlantilla({ nombre: s.nombre, contenido: s.contenido }).texto, contenido: aJson(s.contenido) })),
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return;
    throw e;
  }
}

type Fila = Prisma.DiarioPlantillaGetPayload<{ include: { etiquetas: { select: { etiquetaId: true } } } }>;
const incluir = { etiquetas: { select: { etiquetaId: true }, orderBy: { id: "asc" as const } } };

const aVista = (p: Fila, actor: Actor): PlantillaVista => ({
  id: p.id,
  nombre: p.nombre,
  texto: p.texto,
  contenido: (p.contenido as NodoDoc | null) ?? null,
  etiquetas: p.etiquetas.map((e) => e.etiquetaId),
  predeterminada: p.predeterminada,
  puedoEditar: puedeEditarCatalogo(p, actor),
});

/** Daily You `TemplateDao.getAll`: por nombre. */
export async function listarPlantillas(actor: Actor, tipo: TipoDiario): Promise<PlantillaVista[]> {
  await sembrar(actor, tipo);
  const filas = await prisma.diarioPlantilla.findMany({ where: alcance(actor, tipo), include: incluir });
  return filas.map((p) => aVista(p, actor)).sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }) || a.id - b.id);
}

async function buscar(db: Db, actor: Actor, tipo: TipoDiario, id: number) {
  const p = await db.diarioPlantilla.findFirst({ where: { id, ...alcance(actor, tipo) }, include: incluir });
  if (!p) throw new NoEncontradoError("La plantilla no existe");
  return p;
}

function exigirEdicion(p: { ambito: TipoDiario; creadorId: number | null }, actor: Actor) {
  if (!puedeEditarCatalogo(p, actor)) throw new NoAutorizadoError("Solo quien creó la plantilla o un padre puede cambiarla");
}

/** La predeterminada de la familia la fija un padre; la personal, su dueño (que es quien puede editarla). */
function exigirPermisoPredeterminada(actor: Actor, tipo: TipoDiario) {
  if (tipo === "familiar" && !actor.esPadre) throw new NoAutorizadoError("Solo un padre puede elegir la plantilla predeterminada de la familia");
}

/** Las plantillas solo llevan etiquetas comunes (decisión P6) y tienen que ser visibles en ese ámbito. */
async function verificarEtiquetas(db: Db, actor: Actor, tipo: TipoDiario, ids: number[]) {
  if (!ids.length) return;
  const n = await db.diarioEtiqueta.count({ where: { id: { in: ids }, tipo: "etiqueta", ...alcance(actor, tipo) } });
  if (n !== ids.length) throw new Error("Una de las etiquetas no existe o es un contador (las plantillas no llevan contadores)");
}

/** Una sola predeterminada por ámbito (por persona en el personal). */
const quitarOtrasPredeterminadas = (db: Db, actor: Actor, tipo: TipoDiario, salvoId: number) =>
  db.diarioPlantilla.updateMany({ where: { ...alcance(actor, tipo), predeterminada: true, id: { not: salvoId } }, data: { predeterminada: false } });

export async function crearPlantilla(actor: Actor, tipo: TipoDiario, body: Record<string, unknown>): Promise<number> {
  const v = validarPlantilla(body);
  if (v.predeterminada) exigirPermisoPredeterminada(actor, tipo);
  return prisma.$transaction(async (tx) => {
    if ((await tx.diarioPlantilla.count({ where: alcance(actor, tipo) })) >= MAX_PLANTILLAS_AMBITO) throw new Error(`Llegaste al máximo de ${MAX_PLANTILLAS_AMBITO} plantillas`);
    await verificarEtiquetas(tx, actor, tipo, v.etiquetas ?? []);
    const p = await tx.diarioPlantilla.create({
      data: {
        ambito: tipo,
        creadorId: actor.id,
        nombre: v.nombre,
        texto: v.texto,
        contenido: aJson(v.contenido),
        predeterminada: v.predeterminada ?? false,
        etiquetas: { create: (v.etiquetas ?? []).map((etiquetaId) => ({ etiquetaId })) },
      },
    });
    if (v.predeterminada) await quitarOtrasPredeterminadas(tx, actor, tipo, p.id);
    return p.id;
  });
}

export async function editarPlantilla(actor: Actor, tipo: TipoDiario, id: number, body: Record<string, unknown>): Promise<void> {
  const v = validarPlantilla(body);
  if (v.predeterminada) exigirPermisoPredeterminada(actor, tipo);
  await prisma.$transaction(async (tx) => {
    exigirEdicion(await buscar(tx, actor, tipo, id), actor);
    if (v.etiquetas) await verificarEtiquetas(tx, actor, tipo, v.etiquetas);
    await tx.diarioPlantilla.update({
      where: { id },
      data: {
        nombre: v.nombre,
        texto: v.texto,
        contenido: aJson(v.contenido),
        ...(v.predeterminada !== undefined ? { predeterminada: v.predeterminada } : {}),
        ...(v.etiquetas ? { etiquetas: { deleteMany: {}, create: v.etiquetas.map((etiquetaId) => ({ etiquetaId })) } } : {}),
      },
    });
    if (v.predeterminada) await quitarOtrasPredeterminadas(tx, actor, tipo, id);
  });
}

/** La estrella de la lista (Daily You `Settings.defaultTemplate`): marca o desmarca la predeterminada sin tocar el resto. */
export async function fijarPredeterminada(actor: Actor, tipo: TipoDiario, id: number, valor: unknown): Promise<void> {
  if (typeof valor !== "boolean") throw new Error("Predeterminada inválida");
  exigirPermisoPredeterminada(actor, tipo);
  await prisma.$transaction(async (tx) => {
    const p = await buscar(tx, actor, tipo, id);
    // En el personal, `buscar` ya limita a las propias; en el familiar la elige un padre (exigido arriba)
    await tx.diarioPlantilla.update({ where: { id: p.id }, data: { predeterminada: valor, editadaEn: p.editadaEn } });
    if (valor) await quitarOtrasPredeterminadas(tx, actor, tipo, p.id);
  });
}

/** Daily You borra la plantilla y sus etiquetas; si era la predeterminada, deja de haber predeterminada. */
export async function borrarPlantilla(actor: Actor, tipo: TipoDiario, id: number): Promise<void> {
  exigirEdicion(await buscar(prisma, actor, tipo, id), actor);
  await prisma.diarioPlantilla.delete({ where: { id } });
}
