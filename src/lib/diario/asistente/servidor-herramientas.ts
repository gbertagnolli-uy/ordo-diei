// Asistente del diario (lane 298), lado servidor: ejecuta las herramientas que pide el modelo. SIEMPRE sobre el diario personal de quien tiene la sesión (D2):
// el modelo no elige el ámbito ni la persona. Cada herramienta usa las mismas funciones que la pantalla (crearEntrada, editarEntrada, buscarEntradas, catálogo),
// así que valen las mismas reglas de validación y de permisos.
// Portado de vendor/moodiary/packages/feature/moodiary_assistant/lib/src/data/assistant_tools.dart (`AssistantToolRegistry`; ZhuJHua/moodiary@2c552dd).
import prisma from "@/lib/prisma";
import { aClave, hoyEnFamilia } from "@/lib/habitos/server";
import { FILTRO_VACIO, MAX_CONSULTA, type FiltroBusqueda } from "../busqueda";
import type { NodoDoc } from "../contenido";
import { nombreDeNivel } from "../escala";
import type { Actor } from "../etiquetas";
import { aVista, borrarEntrada, crearEntrada, editarEntrada, incluir } from "../servidor";
import { buscarEntradas } from "../servidor-busqueda";
import { borrar as borrarDelCatalogo, crear as crearEnElCatalogo, editar as editarDelCatalogo, listarCatalogo } from "../servidor-catalogo";
import { leerEscala } from "../servidor-escala";
import {
  BUSQUEDA_MAXIMA,
  BUSQUEDA_POR_DEFECTO,
  MAX_ESCRITURA,
  MAX_LECTURA,
  PREFIJO_FALLO,
  esHerramientaDelDiario,
  idsDe,
  type HerramientaDelDiario,
} from "./herramientas";
import {
  ejecutarLote,
  formatearBusqueda,
  formatearCategorias,
  formatearEntrada,
  formatearLectura,
  formatearResumen,
  mensajeSinResultados,
  type EntradaPlana,
} from "./formato";

type Objeto = Record<string, unknown>;
const TIPO = "personal" as const;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const entero = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
};
const fechaOpcional = (v: unknown): string | null => {
  const t = texto(v);
  return FECHA.test(t) && !Number.isNaN(Date.parse(t)) ? t : null;
};

async function nombresDeAnimo(actor: Actor): Promise<Map<number, string>> {
  return new Map((await leerEscala(actor, TIPO)).map((n) => [n.valor, nombreDeNivel(n)]));
}

const aPlana = (e: { id: number; fecha: string; titulo: string | null; texto: string; animo: number | null; categoriaId: number | null }, etiquetas?: string[]): EntradaPlana => ({
  id: e.id,
  fecha: e.fecha,
  titulo: e.titulo,
  texto: e.texto,
  animo: e.animo,
  categoriaId: e.categoriaId,
  etiquetas,
});

/** Las entradas personales de quien pregunta, por id (cualquier otro id responde como si no existiera). */
const propias = (actor: Actor, ids: number[]) => prisma.diarioEntrada.findMany({ where: { id: { in: ids }, tipo: TIPO, autorId: actor.id }, include: incluir });

// ── Lectura ─────────────────────────────────────────────────────────────────

async function buscar(actor: Actor, args: Objeto): Promise<string> {
  const consulta = texto(args.query).slice(0, MAX_CONSULTA);
  const limite = Math.min(BUSQUEDA_MAXIMA, Math.max(1, entero(args.limit) ?? BUSQUEDA_POR_DEFECTO));
  const categoriaId = entero(args.categoryId);
  const desde = fechaOpcional(args.startDate);
  const hasta = fechaOpcional(args.endDate);
  const orden = texto(args.sort);
  const f: FiltroBusqueda = {
    ...FILTRO_VACIO,
    consulta,
    categoriaId,
    desde,
    hasta,
    limite,
    desplazamiento: 0,
    ...(orden === "relevance" && consulta ? { orden: "relevancia", sentido: "desc" } : orden === "oldest" ? { orden: "fecha", sentido: "asc" } : orden === "newest" || !consulta ? { orden: "fecha", sentido: "desc" } : { orden: "relevancia", sentido: "desc" }),
  };
  const r = await buscarEntradas(actor, TIPO, f);
  if (!r.hallazgos.length) {
    const categoria = categoriaId ? ((await listarCatalogo(actor, TIPO)).categorias.find((c) => c.id === categoriaId)?.nombre ?? null) : null;
    return mensajeSinResultados({ consulta, categoria, desde, hasta });
  }
  return formatearBusqueda(r.hallazgos.map((h) => aPlana(h.entrada)), r.total, await nombresDeAnimo(actor));
}

async function leer(actor: Actor, args: Objeto): Promise<string> {
  const pedidas = idsDe(args).map(entero).filter((n): n is number => n !== null);
  if (!pedidas.length) return `${PREFIJO_FALLO} no diary id given. Get ids from searchDiaries first.`;
  const ids = [...new Set(pedidas)].slice(0, MAX_LECTURA);
  const [filas, nombres, catalogo] = await Promise.all([propias(actor, ids), nombresDeAnimo(actor), listarCatalogo(actor, TIPO)]);
  const etiquetaPorId = new Map(catalogo.etiquetas.map((t) => [t.id, t.nombre]));
  const porId = new Map(filas.map((e) => [e.id, e]));
  const leidas: string[] = [];
  const faltantes: string[] = [];
  for (const id of ids) {
    const fila = porId.get(id);
    if (!fila) {
      faltantes.push(String(id));
      continue;
    }
    const v = aVista(fila, actor);
    leidas.push(formatearEntrada(aPlana(v, v.etiquetas.map((t) => etiquetaPorId.get(t.id)).filter((n): n is string => !!n)), nombres));
  }
  return formatearLectura(leidas, faltantes, [...new Set(pedidas)].length, MAX_LECTURA);
}

async function resumen(actor: Actor): Promise<string> {
  const donde = { tipo: TIPO, autorId: actor.id } as const;
  const [total, porCat, porAnimo, rango, catalogo, nombres] = await Promise.all([
    prisma.diarioEntrada.count({ where: donde }),
    prisma.diarioEntrada.groupBy({ by: ["categoriaId"], where: donde, _count: { _all: true } }),
    prisma.diarioEntrada.groupBy({ by: ["animo"], where: donde, _count: { _all: true } }),
    prisma.diarioEntrada.aggregate({ where: donde, _min: { fecha: true }, _max: { fecha: true } }),
    listarCatalogo(actor, TIPO),
    nombresDeAnimo(actor),
  ]);
  const nombreDeCategoria = new Map(catalogo.categorias.map((c) => [c.id, c.nombre]));
  const conCategoria = porCat.filter((c) => c.categoriaId !== null);
  return formatearResumen(
    {
      total,
      desde: rango._min.fecha ? aClave(rango._min.fecha) : null,
      hasta: rango._max.fecha ? aClave(rango._max.fecha) : null,
      porCategoria: conCategoria.map((c) => ({ id: c.categoriaId as number, nombre: nombreDeCategoria.get(c.categoriaId as number) ?? "(deleted category)", cantidad: c._count._all })),
      sinCategoria: porCat.filter((c) => c.categoriaId === null).reduce((s, c) => s + c._count._all, 0),
      porAnimo: new Map(porAnimo.map((a) => [a.animo, a._count._all])),
    },
    nombres,
  );
}

async function categorias(actor: Actor): Promise<string> {
  return formatearCategorias((await listarCatalogo(actor, TIPO)).categorias.map((c) => ({ id: c.id, nombre: c.nombre, padreId: c.padreId, usos: c.usos })));
}

// ── Escritura de entradas ───────────────────────────────────────────────────

/** `mood` del modelo → ánimo de la entrada. `undefined` = no viene; `null` = sin ánimo; si no es 1–5 lanza. */
function animoDe(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error("mood must be a whole number from 1 to 5, or null.");
  return n;
}

/** `doc` lo agrega el navegador con el Markdown ya convertido al documento del editor; el servidor lo vuelve a sanear en `validarEntrada`. */
const documentoDe = (item: Objeto): NodoDoc | null => (typeof item.doc === "object" && item.doc !== null && !Array.isArray(item.doc) ? (item.doc as NodoDoc) : null);

async function crearUna(actor: Actor, item: Objeto): Promise<string> {
  const cuerpo = texto(item.content);
  if (!cuerpo) return `${PREFIJO_FALLO} the body cannot be empty.`;
  const animo = animoDe(item.mood);
  const fecha = fechaOpcional(item.date) ?? hoyEnFamilia();
  const categoriaId = item.categoryId === undefined || item.categoryId === null ? undefined : entero(item.categoryId);
  if (item.categoryId !== undefined && item.categoryId !== null && categoriaId === null) return `${PREFIJO_FALLO} categoryId must be a category id from listCategories.`;
  const doc = documentoDe(item);
  const creada = await crearEntrada(actor, TIPO, {
    fecha,
    titulo: texto(item.title) || null,
    ...(doc ? { contenido: doc } : { texto: cuerpo }),
    animo: animo ?? null,
    ...(categoriaId ? { categoriaId } : {}),
  });
  return `Created "${creada.titulo?.trim() || "Untitled"}" (${creada.fecha}), id=${creada.id}.`;
}

async function editarUna(actor: Actor, item: Objeto): Promise<string> {
  const id = entero(item.id);
  if (id === null) return `${PREFIJO_FALLO} no diary id given.`;
  const [fila] = await propias(actor, [id]);
  if (!fila) return `${PREFIJO_FALLO} no diary with id=${id}.`;
  const animo = animoDe(item.mood);
  const cambiaTexto = item.content !== undefined && item.content !== null;
  const cuerpo = texto(item.content);
  if (cambiaTexto && !cuerpo) return `${PREFIJO_FALLO} the body cannot be empty (id=${id}).`;
  const doc = documentoDe(item);
  let categoriaId: number | null | undefined;
  if (item.categoryId === null) categoriaId = null;
  else if (item.categoryId !== undefined) {
    categoriaId = entero(item.categoryId);
    if (categoriaId === null) return `${PREFIJO_FALLO} categoryId must be a category id from listCategories, or null.`;
  }
  const actual = fila.contenido as NodoDoc | null;
  const editada = await editarEntrada(actor, id, {
    fecha: fechaOpcional(item.date) ?? aClave(fila.fecha),
    hora: fila.hora,
    titulo: item.title !== undefined ? texto(item.title) || null : fila.titulo,
    // Las fotos se reemplazan en cada edición: se mandan las que ya tenía
    fotos: fila.fotos.map((f) => f.url),
    animo: animo !== undefined ? animo : fila.animo,
    ...(cambiaTexto ? (doc ? { contenido: doc } : { texto: cuerpo }) : actual ? { contenido: actual } : { texto: fila.texto }),
    ...(categoriaId !== undefined ? { categoriaId } : {}),
  });
  return `Updated "${editada.titulo?.trim() || "Untitled"}" (id=${id}).`;
}

async function borrarUna(actor: Actor, item: Objeto): Promise<string> {
  const id = entero(item.id);
  if (id === null) return `${PREFIJO_FALLO} no diary id given.`;
  const [fila] = await propias(actor, [id]);
  if (!fila) return `${PREFIJO_FALLO} no diary with id=${id}.`;
  await borrarEntrada(actor, id);
  return `Deleted "${fila.titulo?.trim() || "Untitled"}" (id=${id}). It is gone for good.`;
}

// ── Categorías ──────────────────────────────────────────────────────────────

async function crearCategoria(actor: Actor, item: Objeto): Promise<string> {
  const nombre = texto(item.name);
  if (!nombre) return `${PREFIJO_FALLO} the category name cannot be empty.`;
  const padreId = item.parentId === undefined || item.parentId === null ? null : entero(item.parentId);
  if (item.parentId != null && padreId === null) return `${PREFIJO_FALLO} parentId must be a category id from listCategories.`;
  const id = await crearEnElCatalogo(actor, TIPO, "categorias", { nombre, padreId });
  return `Created category "${nombre}", id=${id}.`;
}

async function editarCategoria(actor: Actor, item: Objeto): Promise<string> {
  const id = entero(item.id);
  if (id === null) return `${PREFIJO_FALLO} no category id given.`;
  const actual = (await listarCatalogo(actor, TIPO)).categorias.find((c) => c.id === id);
  if (!actual) return `${PREFIJO_FALLO} no category with id=${id}.`;
  const nombre = item.name !== undefined ? texto(item.name) : actual.nombre;
  if (!nombre) return `${PREFIJO_FALLO} the category name cannot be empty.`;
  let padreId = actual.padreId;
  if (item.parentId === null) padreId = null;
  else if (item.parentId !== undefined) {
    padreId = entero(item.parentId);
    if (padreId === null) return `${PREFIJO_FALLO} parentId must be a category id from listCategories, or null.`;
  }
  await editarDelCatalogo(actor, TIPO, "categorias", id, { nombre, padreId, color: actual.color });
  return `Updated the category "${nombre}" (id=${id}).`;
}

async function borrarCategoria(actor: Actor, item: Objeto): Promise<string> {
  const id = entero(item.id);
  if (id === null) return `${PREFIJO_FALLO} no category id given.`;
  await borrarDelCatalogo(actor, TIPO, "categorias", id);
  return `Deleted the category (id=${id}).`;
}

// ── Entrada ─────────────────────────────────────────────────────────────────

/** Ejecuta una herramienta. Nunca lanza: un error se devuelve como `Failed: …` para que el modelo lo vea. */
export async function ejecutarHerramienta(actor: Actor, nombre: string, args: Objeto): Promise<string> {
  // Las de memoria (lane 299) corren en el navegador: acá solo se ejecutan las del diario
  if (!esHerramientaDelDiario(nombre)) return `${PREFIJO_FALLO} unknown tool "${nombre}".`;
  try {
    return await despachar(actor, nombre, args);
  } catch (e) {
    return `${PREFIJO_FALLO} ${nombre} threw ${e instanceof Error ? e.message : String(e)}. Check the arguments against the schema, then retry or take another route.`;
  }
}

function despachar(actor: Actor, nombre: HerramientaDelDiario, args: Objeto): Promise<string> {
  switch (nombre) {
    case "searchDiaries":
      return buscar(actor, args);
    case "getDiary":
      return leer(actor, args);
    case "diaryOverview":
      return resumen(actor);
    case "listCategories":
      return categorias(actor);
    case "createDiary":
      return ejecutarLote(args, (it) => crearUna(actor, it), MAX_ESCRITURA);
    case "updateDiary":
      return ejecutarLote(args, (it) => editarUna(actor, it), MAX_ESCRITURA);
    case "deleteDiary":
      return ejecutarLote(args, (it) => borrarUna(actor, it), MAX_ESCRITURA);
    case "createCategory":
      return ejecutarLote(args, (it) => crearCategoria(actor, it), MAX_ESCRITURA);
    case "updateCategory":
      return ejecutarLote(args, (it) => editarCategoria(actor, it), MAX_ESCRITURA);
    case "deleteCategory":
      return ejecutarLote(args, (it) => borrarCategoria(actor, it), MAX_ESCRITURA);
  }
}
