// Diario (lane 284), lado servidor: catálogo de etiquetas, categorías de etiquetas y categorías de entrada.
// Personal = solo del creador; familiar = de toda la familia (las edita su creador o un padre). Se hace cumplir acá, en cada consulta.
// Portado de vendor/Daily_You/lib/providers/tags_provider.dart (Demizo/Daily_You@7cc237d) y vendor/moodiary/.../category_repository.dart (ZhuJHua/moodiary@2c552dd).
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { NoAutorizadoError, NoEncontradoError } from "@/lib/habitos/server";
import {
  MAX_CATEGORIAS_AMBITO,
  MAX_ETIQUETAS_AMBITO,
  MAX_GRUPOS_AMBITO,
  SEMILLA_GRUPOS,
  SEMILLA_SUELTAS,
  puedeEditarCatalogo,
  validarCategoria,
  validarContraCatalogo,
  validarEtiqueta,
  validarGrupo,
  validarPadre,
  type Actor,
  type EtiquetaPuesta,
  type TipoEtiqueta,
  type TipoIcono,
} from "./etiquetas";
import type { TipoDiario } from "./reglas";

type Db = Prisma.TransactionClient;

export type GrupoVista = {
  id: number;
  nombre: string;
  icono: string | null;
  tipoIcono: TipoIcono;
  color: string | null;
  orden: number;
  seleccionUnica: boolean;
  puedoEditar: boolean;
};
export type EtiquetaVista = {
  id: number;
  grupoId: number | null;
  nombre: string;
  icono: string | null;
  tipoIcono: TipoIcono;
  color: string | null;
  tipo: TipoEtiqueta;
  orden: number;
  /** En cuántas entradas está puesta (Daily You `entryCountForTag`). */
  usos: number;
  /** Contadores: hasta 10 valores ya usados, del más frecuente al menos (Daily You `_frequentValues`). */
  valoresFrecuentes: string[];
  puedoEditar: boolean;
};
export type CategoriaVista = { id: number; padreId: number | null; nombre: string; color: string | null; usos: number; puedoEditar: boolean };
export type Catalogo = { grupos: GrupoVista[]; etiquetas: EtiquetaVista[]; categorias: CategoriaVista[] };

export type Recurso = "etiquetas" | "grupos" | "categorias";
export const esRecurso = (v: unknown): v is Recurso => v === "etiquetas" || v === "grupos" || v === "categorias";

const CLAVE_SIEMBRA = "etiquetas";

/** Lo que el actor puede ver en ese ámbito. */
const alcance = (actor: Actor, tipo: TipoDiario) => ({ ambito: tipo, ...(tipo === "personal" ? { creadorId: actor.id } : {}) });

const noExiste = (que: string) => new NoEncontradoError(`${que} no existe`);
const sinPermiso = (que: string) => new NoAutorizadoError(`Solo quien creó ${que} o un padre puede cambiarla`);

// ── Siembra única ───────────────────────────────────────────────────────────

/** Daily You crea las etiquetas y categorías por defecto una sola vez. Acá, una vez por ámbito (por persona en el personal). */
async function sembrar(actor: Actor, tipo: TipoDiario): Promise<void> {
  const duenoId = tipo === "personal" ? actor.id : 0;
  const clave = { ambito_duenoId_clave: { ambito: tipo, duenoId, clave: CLAVE_SIEMBRA } };
  if (await prisma.diarioSembrado.findUnique({ where: clave })) return;
  const creadorId = tipo === "personal" ? actor.id : null;
  try {
    await prisma.$transaction(
      async (tx) => {
        // Si dos pedidos llegan a la vez, el segundo choca con el índice único y no siembra de nuevo
        await tx.diarioSembrado.create({ data: { ambito: tipo, duenoId, clave: CLAVE_SIEMBRA } });
        await tx.diarioEtiqueta.createMany({
          data: SEMILLA_SUELTAS.map((e, orden) => ({
            ambito: tipo,
            creadorId,
            nombre: e.nombre,
            icono: e.icono,
            tipoIcono: e.tipoIcono,
            color: e.color ?? null,
            tipo: e.tipo ?? "etiqueta",
            orden,
          })),
        });
        for (const [orden, g] of SEMILLA_GRUPOS.entries()) {
          const grupo = await tx.diarioGrupoEtiquetas.create({
            data: { ambito: tipo, creadorId, nombre: g.nombre, icono: g.icono, tipoIcono: g.tipoIcono, seleccionUnica: g.seleccionUnica, orden },
          });
          if (g.etiquetas.length) {
            await tx.diarioEtiqueta.createMany({
              data: g.etiquetas.map((e, i) => ({
                ambito: tipo,
                creadorId,
                grupoId: grupo.id,
                nombre: e.nombre,
                icono: e.icono,
                tipoIcono: e.tipoIcono,
                color: e.color ?? null,
                tipo: e.tipo ?? "etiqueta",
                orden: i,
              })),
            });
          }
        }
      },
      { timeout: 30_000, maxWait: 10_000 },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return;
    throw e;
  }
}

// ── Lectura ─────────────────────────────────────────────────────────────────

export async function listarCatalogo(actor: Actor, tipo: TipoDiario): Promise<Catalogo> {
  await sembrar(actor, tipo);
  const donde = alcance(actor, tipo);
  const [grupos, etiquetas, categorias] = await Promise.all([
    prisma.diarioGrupoEtiquetas.findMany({ where: donde, orderBy: [{ orden: "asc" }, { id: "asc" }] }),
    prisma.diarioEtiqueta.findMany({ where: donde, orderBy: [{ orden: "asc" }, { id: "asc" }] }),
    prisma.diarioCategoria.findMany({ where: donde, orderBy: { id: "asc" } }),
  ]);
  const idsContador = etiquetas.filter((e) => e.tipo === "contador").map((e) => e.id);
  const [usosEtiqueta, usosCategoria, valores] = await Promise.all([
    prisma.diarioEntradaEtiqueta.groupBy({ by: ["etiquetaId"], where: { etiquetaId: { in: etiquetas.map((e) => e.id) } }, _count: { _all: true } }),
    prisma.diarioEntrada.groupBy({ by: ["categoriaId"], where: { categoriaId: { in: categorias.map((c) => c.id) } }, _count: { _all: true } }),
    idsContador.length
      ? prisma.diarioEntradaEtiqueta.groupBy({ by: ["etiquetaId", "valor"], where: { etiquetaId: { in: idsContador }, valor: { not: null } }, _count: { _all: true } })
      : Promise.resolve([]),
  ]);
  const frecuentes = new Map<number, { valor: string; n: number }[]>();
  for (const v of valores) if (v.valor != null) frecuentes.set(v.etiquetaId, [...(frecuentes.get(v.etiquetaId) ?? []), { valor: v.valor, n: v._count._all }]);
  const usoE = new Map(usosEtiqueta.map((u) => [u.etiquetaId, u._count._all]));
  const usoC = new Map(usosCategoria.map((u) => [u.categoriaId, u._count._all]));
  return {
    grupos: grupos.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      icono: g.icono,
      tipoIcono: g.tipoIcono,
      color: g.color,
      orden: g.orden,
      seleccionUnica: g.seleccionUnica,
      puedoEditar: puedeEditarCatalogo(g, actor),
    })),
    etiquetas: etiquetas.map((e) => ({
      id: e.id,
      grupoId: e.grupoId,
      nombre: e.nombre,
      icono: e.icono,
      tipoIcono: e.tipoIcono,
      color: e.color,
      tipo: e.tipo,
      orden: e.orden,
      usos: usoE.get(e.id) ?? 0,
      valoresFrecuentes: (frecuentes.get(e.id) ?? [])
        .sort((a, b) => b.n - a.n || Number(a.valor) - Number(b.valor))
        .slice(0, 10)
        .map((x) => x.valor),
      puedoEditar: puedeEditarCatalogo(e, actor),
    })),
    categorias: categorias.map((c) => ({ id: c.id, padreId: c.padreId, nombre: c.nombre, color: c.color, usos: usoC.get(c.id) ?? 0, puedoEditar: puedeEditarCatalogo(c, actor) })),
  };
}

// ── Escritura ───────────────────────────────────────────────────────────────

async function buscarGrupo(db: Db, actor: Actor, tipo: TipoDiario, id: number) {
  const g = await db.diarioGrupoEtiquetas.findFirst({ where: { id, ...alcance(actor, tipo) } });
  if (!g) throw noExiste("La categoría de etiquetas");
  return g;
}
async function buscarEtiqueta(db: Db, actor: Actor, tipo: TipoDiario, id: number) {
  const e = await db.diarioEtiqueta.findFirst({ where: { id, ...alcance(actor, tipo) } });
  if (!e) throw noExiste("La etiqueta");
  return e;
}
async function buscarCategoria(db: Db, actor: Actor, tipo: TipoDiario, id: number) {
  const c = await db.diarioCategoria.findFirst({ where: { id, ...alcance(actor, tipo) } });
  if (!c) throw noExiste("La categoría");
  return c;
}

const siguienteOrden = async (agregado: Promise<number | null>) => ((await agregado) ?? -1) + 1;

export async function crear(actor: Actor, tipo: TipoDiario, recurso: Recurso, body: Record<string, unknown>): Promise<number> {
  const creadorId = actor.id;
  return prisma.$transaction(async (tx) => {
    const donde = alcance(actor, tipo);
    if (recurso === "etiquetas") {
      const v = validarEtiqueta(body);
      if ((await tx.diarioEtiqueta.count({ where: donde })) >= MAX_ETIQUETAS_AMBITO) throw new Error("Llegaste al máximo de etiquetas");
      if (v.grupoId != null) await buscarGrupo(tx, actor, tipo, v.grupoId);
      const orden = await siguienteOrden(tx.diarioEtiqueta.aggregate({ where: donde, _max: { orden: true } }).then((r) => r._max.orden));
      return (await tx.diarioEtiqueta.create({ data: { ...v, ambito: tipo, creadorId, orden }, select: { id: true } })).id;
    } else if (recurso === "grupos") {
      const v = validarGrupo(body);
      if ((await tx.diarioGrupoEtiquetas.count({ where: donde })) >= MAX_GRUPOS_AMBITO) throw new Error("Llegaste al máximo de categorías de etiquetas");
      const orden = await siguienteOrden(tx.diarioGrupoEtiquetas.aggregate({ where: donde, _max: { orden: true } }).then((r) => r._max.orden));
      return (await tx.diarioGrupoEtiquetas.create({ data: { ...v, ambito: tipo, creadorId, orden }, select: { id: true } })).id;
    } else {
      const v = validarCategoria(body);
      const todas = await tx.diarioCategoria.findMany({ where: donde, select: { id: true, padreId: true, nombre: true } });
      if (todas.length >= MAX_CATEGORIAS_AMBITO) throw new Error("Llegaste al máximo de categorías");
      validarPadre(null, v.padreId, todas);
      return (await tx.diarioCategoria.create({ data: { ...v, ambito: tipo, creadorId }, select: { id: true } })).id;
    }
  });
}

export async function editar(actor: Actor, tipo: TipoDiario, recurso: Recurso, id: number, body: Record<string, unknown>): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (recurso === "etiquetas") {
      const actual = await buscarEtiqueta(tx, actor, tipo, id);
      if (!puedeEditarCatalogo(actual, actor)) throw sinPermiso("la etiqueta");
      // Como en Daily You, el tipo (etiqueta o contador) no cambia después de crearla
      const v = validarEtiqueta({ ...body, tipo: actual.tipo });
      let orden = actual.orden;
      if (v.grupoId !== actual.grupoId) {
        if (v.grupoId != null) await buscarGrupo(tx, actor, tipo, v.grupoId);
        orden = await siguienteOrden(tx.diarioEtiqueta.aggregate({ where: { ...alcance(actor, tipo), grupoId: v.grupoId }, _max: { orden: true } }).then((r) => r._max.orden));
      }
      await tx.diarioEtiqueta.update({ where: { id }, data: { ...v, orden } });
    } else if (recurso === "grupos") {
      const actual = await buscarGrupo(tx, actor, tipo, id);
      if (!puedeEditarCatalogo(actual, actor)) throw sinPermiso("la categoría");
      await tx.diarioGrupoEtiquetas.update({ where: { id }, data: validarGrupo(body) });
    } else {
      const actual = await buscarCategoria(tx, actor, tipo, id);
      if (!puedeEditarCatalogo(actual, actor)) throw sinPermiso("la categoría");
      const v = validarCategoria(body);
      const todas = await tx.diarioCategoria.findMany({ where: alcance(actor, tipo), select: { id: true, padreId: true, nombre: true } });
      validarPadre(id, v.padreId, todas);
      await tx.diarioCategoria.update({ where: { id }, data: v });
    }
  });
}

export async function borrar(actor: Actor, tipo: TipoDiario, recurso: Recurso, id: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (recurso === "etiquetas") {
      const actual = await buscarEtiqueta(tx, actor, tipo, id);
      if (!puedeEditarCatalogo(actual, actor)) throw sinPermiso("la etiqueta");
      // La base la saca de las entradas (ON DELETE CASCADE), como `remove` de Daily You
      await tx.diarioEtiqueta.delete({ where: { id } });
    } else if (recurso === "grupos") {
      const actual = await buscarGrupo(tx, actor, tipo, id);
      if (!puedeEditarCatalogo(actual, actor)) throw sinPermiso("la categoría");
      // Daily You `removeCategoryAndTags`: se borran también sus etiquetas (y salen de las entradas)
      await tx.diarioGrupoEtiquetas.delete({ where: { id } });
    } else {
      const actual = await buscarCategoria(tx, actor, tipo, id);
      if (!puedeEditarCatalogo(actual, actor)) throw sinPermiso("la categoría");
      // moodiary `deleteACategory`: no se borra una categoría que tiene entradas
      if (await tx.diarioEntrada.count({ where: { categoriaId: id } })) throw new Error("La categoría tiene entradas: cambialas de categoría antes de borrarla");
      if (await tx.diarioCategoria.count({ where: { padreId: id } })) throw new Error("La categoría tiene subcategorías: borralas o movelas antes");
      await tx.diarioCategoria.delete({ where: { id } });
    }
  });
}

/** Guarda el orden de etiquetas o de categorías de etiquetas. Es una preferencia de presentación: cualquiera que las ve puede ordenarlas (E8). */
export async function reordenar(actor: Actor, tipo: TipoDiario, recurso: "etiquetas" | "grupos", ids: unknown): Promise<void> {
  if (!Array.isArray(ids) || ids.length > 500 || ids.some((i) => !Number.isInteger(i) || i <= 0) || new Set(ids).size !== ids.length) throw new Error("Orden inválido");
  const lista = ids as number[];
  await prisma.$transaction(async (tx) => {
    const donde = { id: { in: lista }, ...alcance(actor, tipo) };
    const hay = recurso === "etiquetas" ? await tx.diarioEtiqueta.count({ where: donde }) : await tx.diarioGrupoEtiquetas.count({ where: donde });
    if (hay !== lista.length) throw noExiste("Alguna de las etiquetas");
    for (const [orden, id] of lista.entries()) {
      if (recurso === "etiquetas") await tx.diarioEtiqueta.update({ where: { id }, data: { orden } });
      else await tx.diarioGrupoEtiquetas.update({ where: { id }, data: { orden } });
    }
  });
}

// ── Para las entradas ───────────────────────────────────────────────────────

/** Valida las etiquetas puestas contra el catálogo que el actor ve en ese ámbito. Devuelve las normalizadas. */
export async function prepararEtiquetas(db: Db, actor: Actor, tipo: TipoDiario, puestas: EtiquetaPuesta[]): Promise<EtiquetaPuesta[]> {
  if (!puestas.length) return [];
  const etiquetas = await db.diarioEtiqueta.findMany({ where: { id: { in: puestas.map((p) => p.id) }, ...alcance(actor, tipo) }, select: { id: true, nombre: true, tipo: true, grupoId: true } });
  const grupoIds = [...new Set(etiquetas.map((e) => e.grupoId).filter((g): g is number => g != null))];
  const grupos = await db.diarioGrupoEtiquetas.findMany({ where: { id: { in: grupoIds } }, select: { id: true, nombre: true, seleccionUnica: true } });
  return validarContraCatalogo(puestas, new Map(etiquetas.map((e) => [e.id, e])), new Map(grupos.map((g) => [g.id, g])));
}

/** La categoría de la entrada tiene que existir en ese ámbito. */
export async function verificarCategoria(db: Db, actor: Actor, tipo: TipoDiario, categoriaId: number): Promise<void> {
  await buscarCategoria(db, actor, tipo, categoriaId);
}
