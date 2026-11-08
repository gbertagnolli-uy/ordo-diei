// Diario (lane 296), lado servidor: lugares frecuentes. Personal = solo del creador; familiar = de toda la familia (los edita su creador o un padre).
// Se hace cumplir acá, en cada consulta, igual que el catálogo de etiquetas (servidor-catalogo.ts).
// Portado de vendor/moodiary/packages/feature_base/moodiary_data/lib/src/place_repository.dart (`insertAPlace`, `deleteAPlace`, `getPlaceByName`)
// y de moodiary_editor/lib/src/application/edit_controller.dart (`fetchPosition`) (ZhuJHua/moodiary@2c552dd).
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { NoAutorizadoError, NoEncontradoError } from "@/lib/habitos/server";
import { puedeEditarCatalogo, type Actor } from "./etiquetas";
import {
  MAX_LUGARES_AMBITO,
  claveDeNombre,
  lugarCercano,
  nombreDeCoordenadas,
  validarLatitud,
  validarLongitud,
  validarLugar,
  validarOrdenLugares,
  type IconoLugar,
} from "./lugares";
import { nombreDeUbicacion } from "./servidor-clima";
import type { TipoDiario } from "./reglas";

type Db = Prisma.TransactionClient;

export type LugarVista = {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  icono: IconoLugar | null;
  orden: number;
  /** En cuántas entradas está puesto (moodiary `placeFootprints().count`, el contador del administrador). */
  usos: number;
  puedoEditar: boolean;
};

/** Lo que el actor puede ver en ese ámbito. */
const alcance = (actor: Actor, tipo: TipoDiario) => ({ ambito: tipo, ...(tipo === "personal" ? { creadorId: actor.id } : {}) });

const noExiste = () => new NoEncontradoError("El lugar no existe");
const sinPermiso = () => new NoAutorizadoError("Solo quien creó el lugar o un padre puede cambiarlo");

type Fila = { id: number; ambito: TipoDiario; creadorId: number | null; nombre: string; latitud: number; longitud: number; icono: string | null; orden: number };

const aVista = (f: Fila, usos: number, actor: Actor): LugarVista => ({
  id: f.id,
  nombre: f.nombre,
  latitud: f.latitud,
  longitud: f.longitud,
  icono: f.icono as IconoLugar | null,
  orden: f.orden,
  usos,
  puedoEditar: puedeEditarCatalogo(f, actor),
});

// ── Lectura ─────────────────────────────────────────────────────────────────

export async function listarLugares(actor: Actor, tipo: TipoDiario): Promise<LugarVista[]> {
  const filas = await prisma.diarioLugar.findMany({ where: alcance(actor, tipo), orderBy: [{ orden: "asc" }, { id: "asc" }] });
  const usos = filas.length
    ? await prisma.diarioEntrada.groupBy({ by: ["lugarId"], where: { lugarId: { in: filas.map((f) => f.id) } }, _count: { _all: true } })
    : [];
  const porId = new Map(usos.map((u) => [u.lugarId, u._count._all]));
  return filas.map((f) => aVista(f, porId.get(f.id) ?? 0, actor));
}

async function buscar(db: Db, actor: Actor, tipo: TipoDiario, id: number) {
  const l = await db.diarioLugar.findFirst({ where: { id, ...alcance(actor, tipo) } });
  if (!l) throw noExiste();
  return l;
}

const siguienteOrden = async (db: Db, actor: Actor, tipo: TipoDiario) =>
  (((await db.diarioLugar.aggregate({ where: alcance(actor, tipo), _max: { orden: true } }))._max.orden) ?? -1) + 1;

// ── Escritura ───────────────────────────────────────────────────────────────

async function crearEn(db: Db, actor: Actor, tipo: TipoDiario, v: { nombre: string; latitud: number; longitud: number; icono: IconoLugar | null }): Promise<Fila> {
  if ((await db.diarioLugar.count({ where: alcance(actor, tipo) })) >= MAX_LUGARES_AMBITO) throw new Error("Llegaste al máximo de lugares");
  return db.diarioLugar.create({ data: { ...v, ambito: tipo, creadorId: actor.id, orden: await siguienteOrden(db, actor, tipo) } });
}

export async function crearLugar(actor: Actor, tipo: TipoDiario, body: Record<string, unknown>): Promise<number> {
  const v = validarLugar(body);
  return prisma.$transaction(async (tx) => (await crearEn(tx, actor, tipo, v)).id);
}

export async function editarLugar(actor: Actor, tipo: TipoDiario, id: number, body: Record<string, unknown>): Promise<void> {
  const v = validarLugar(body);
  await prisma.$transaction(async (tx) => {
    const actual = await buscar(tx, actor, tipo, id);
    if (!puedeEditarCatalogo(actual, actor)) throw sinPermiso();
    await tx.diarioLugar.update({ where: { id }, data: v });
  });
}

/** moodiary `deleteAPlace`: un lugar con entradas no se borra. */
export async function borrarLugar(actor: Actor, tipo: TipoDiario, id: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const actual = await buscar(tx, actor, tipo, id);
    if (!puedeEditarCatalogo(actual, actor)) throw sinPermiso();
    if (await tx.diarioEntrada.count({ where: { lugarId: id } })) throw new Error("El lugar tiene entradas: cambialas de lugar antes de borrarlo");
    await tx.diarioLugar.delete({ where: { id } });
  });
}

/** Guarda el orden. Es una preferencia de presentación: cualquiera que los ve puede ordenarlos (como las etiquetas, lane 284). */
export async function reordenarLugares(actor: Actor, tipo: TipoDiario, ids: unknown): Promise<void> {
  const lista = validarOrdenLugares(ids);
  await prisma.$transaction(async (tx) => {
    const hay = await tx.diarioLugar.count({ where: { id: { in: lista }, ...alcance(actor, tipo) } });
    if (hay !== lista.length) throw noExiste();
    for (const [orden, id] of lista.entries()) await tx.diarioLugar.update({ where: { id }, data: { orden } });
  });
}

// ── Lugar a partir de la ubicación ──────────────────────────────────────────

/**
 * moodiary `fetchPosition`: la ubicación pasa a ser un lugar. Primero el que ya esté a 200 m (`matchAt`); si no, se le pone nombre con el
 * geocodificador y se reusa el que tenga ese nombre (moodiary: `idForName` / `getPlaceByName`); si tampoco, se crea. Sin nombre, `lat, lon`.
 */
export async function lugarDeUbicacion(actor: Actor, tipo: TipoDiario, body: Record<string, unknown>): Promise<LugarVista> {
  const latitud = validarLatitud(body.latitud);
  const longitud = validarLongitud(body.longitud);
  const existentes = await prisma.diarioLugar.findMany({ where: alcance(actor, tipo) });
  const cerca = lugarCercano(existentes, latitud, longitud);
  if (cerca) return aVista(cerca, await prisma.diarioEntrada.count({ where: { lugarId: cerca.id } }), actor);
  const nombre = (await nombreDeUbicacion(latitud, longitud)) ?? nombreDeCoordenadas(latitud, longitud);
  const clave = claveDeNombre(nombre);
  const igual = existentes.find((l) => claveDeNombre(l.nombre) === clave);
  if (igual) return aVista(igual, await prisma.diarioEntrada.count({ where: { lugarId: igual.id } }), actor);
  const nuevo = await prisma.$transaction((tx) => crearEn(tx, actor, tipo, { nombre, latitud, longitud, icono: null }));
  return aVista(nuevo, 0, actor);
}

// ── Para las entradas ───────────────────────────────────────────────────────

/** El lugar de la entrada tiene que existir en ese ámbito. */
export async function verificarLugar(db: Db, actor: Actor, tipo: TipoDiario, lugarId: number): Promise<void> {
  await buscar(db, actor, tipo, lugarId);
}

/**
 * Importaciones (moodiary `_resolvePlace`): por nombre, luego por cercanía, y si no, se crea. `lugares` es la lista en memoria del lote.
 * No la modifica: si se creó un lugar, viene en `nuevo` y quien llama lo agrega cuando la entrada ya se escribió.
 */
export async function resolverLugarImportado(
  db: Db,
  actor: Actor,
  tipo: TipoDiario,
  lugares: { id: number; nombre: string; latitud: number; longitud: number }[],
  dato: { nombre: string | null; latitud: number; longitud: number },
): Promise<{ id: number; nuevo: { id: number; nombre: string; latitud: number; longitud: number } | null }> {
  const nombre = dato.nombre?.trim() ?? "";
  if (nombre) {
    const clave = claveDeNombre(nombre);
    const igual = lugares.find((l) => claveDeNombre(l.nombre) === clave);
    if (igual) return { id: igual.id, nuevo: null };
  }
  const cerca = lugarCercano(lugares, dato.latitud, dato.longitud);
  if (cerca) return { id: cerca.id, nuevo: null };
  const v = validarLugar({ nombre: nombre || nombreDeCoordenadas(dato.latitud, dato.longitud), latitud: dato.latitud, longitud: dato.longitud });
  const l = await crearEn(db, actor, tipo, v);
  return { id: l.id, nuevo: { id: l.id, nombre: l.nombre, latitud: l.latitud, longitud: l.longitud } };
}
