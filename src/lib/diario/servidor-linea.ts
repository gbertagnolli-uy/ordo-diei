// Diario (lane 289), lado servidor: páginas de la línea de tiempo y entradas del mismo día de otros años.
// La privacidad del personal se hace cumplir acá, en cada consulta (D1): el personal solo muestra las entradas del autor; el familiar, las de toda la familia.
// Portado de vendor/moodiary/.../application/timeline_controller.dart y diary_repository.dart (`diaryCountByMonth`) (ZhuJHua/moodiary@2c552dd),
// de vendor/Daily_You/lib/pages/home_page.dart + flashback_manager.dart (Demizo/Daily_You@7cc237d) y de vendor/storypad/lib/views/throwback (theachoem/storypad@a76825e).
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { APP_TZ, aClave, aFecha, hoyEnFamilia } from "@/lib/habitos/server";
import { descendientes } from "./busqueda";
import { MAX_FILAS } from "./estadisticas";
import type { Actor } from "./etiquetas";
import {
  PAGINA_LINEA,
  SIN_CATEGORIA,
  compararEnElDia,
  escribirCursor,
  leerCursor,
  type CursorLinea,
  type ItemLinea,
  type OrdenLinea,
} from "./linea";
import { calcularRecuerdos, esDiaMes, fechasDelDiaMes, type ClaveRecuerdo, type EleccionesDelDia, type FilaRecuerdo, type OpcionesRecuerdos } from "./recuerdos";
import type { TipoDiario } from "./reglas";
import { aVista, incluir, minutosEnFamilia, type EntradaVista } from "./servidor";

const dondeBase = (actor: Actor, tipo: TipoDiario): Prisma.DiarioEntradaWhereInput => ({ tipo, ...(tipo === "personal" ? { autorId: actor.id } : {}) });

// ── Línea de tiempo ──────────────────────────────────────────────────────────

export interface PaginaLinea {
  items: ItemLinea<EntradaVista>[];
  /** Cursor de la página siguiente, o null si no hay más. */
  siguiente: string | null;
  /** Entradas de cada mes que aparece en la página ("YYYY-MM"), con el filtro aplicado. Vacío en «Última edición». */
  conteoMeses: Record<string, number>;
}

async function filtroCategoria(actor: Actor, tipo: TipoDiario, categoria: number | typeof SIN_CATEGORIA | null): Promise<Prisma.DiarioEntradaWhereInput> {
  if (categoria === null) return {};
  if (categoria === SIN_CATEGORIA) return { categoriaId: null };
  const todas = await prisma.diarioCategoria.findMany({
    where: { ambito: tipo, ...(tipo === "personal" ? { creadorId: actor.id } : {}) },
    select: { id: true, padreId: true },
  });
  return { categoriaId: { in: descendientes(categoria, todas) } };
}

const mesSiguiente = (mes: string) => {
  const [y, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(y, m, 1));
};

export async function paginaLinea(actor: Actor, tipo: TipoDiario, orden: OrdenLinea, crudoCursor: string | null, categoria: number | typeof SIN_CATEGORIA | null): Promise<PaginaLinea> {
  const cursor: CursorLinea | null = leerCursor(orden, crudoCursor);
  const base: Prisma.DiarioEntradaWhereInput = { AND: [dondeBase(actor, tipo), await filtroCategoria(actor, tipo, categoria)] };

  if (orden === "edicion") {
    const desde: Prisma.DiarioEntradaWhereInput =
      cursor?.tipo === "edicion" ? { OR: [{ editadaEn: { lt: new Date(cursor.editadaEn) } }, { editadaEn: new Date(cursor.editadaEn), id: { lt: cursor.id } }] } : {};
    const filas = await prisma.diarioEntrada.findMany({ where: { AND: [base, desde] }, orderBy: [{ editadaEn: "desc" }, { id: "desc" }], take: PAGINA_LINEA + 1, include: incluir });
    const hayMas = filas.length > PAGINA_LINEA;
    const pagina = hayMas ? filas.slice(0, PAGINA_LINEA) : filas;
    const ultima = pagina[pagina.length - 1];
    return {
      items: pagina.map((e) => ({ entrada: aVista(e, actor), sello: { fecha: format(e.editadaEn, "yyyy-MM-dd", { in: tz(APP_TZ) }), hora: minutosEnFamilia(e.editadaEn) } })),
      siguiente: hayMas && ultima ? escribirCursor({ tipo: "edicion", editadaEn: ultima.editadaEn.toISOString(), id: ultima.id }) : null,
      conteoMeses: {},
    };
  }

  const desc = orden === "fecha-desc";
  const dir = desc ? "desc" : "asc";
  const desde: Prisma.DiarioEntradaWhereInput = cursor?.tipo === "fecha" ? { fecha: desc ? { lt: aFecha(cursor.fecha) } : { gt: aFecha(cursor.fecha) } } : {};
  const filas = await prisma.diarioEntrada.findMany({ where: { AND: [base, desde] }, orderBy: [{ fecha: dir }, { id: dir }], take: PAGINA_LINEA + 1, include: incluir });
  const hayMas = filas.length > PAGINA_LINEA;
  let pagina = hayMas ? filas.slice(0, PAGINA_LINEA) : filas;
  let siguiente: string | null = null;
  if (hayMas) {
    // Se completa siempre el último día: una página nunca corta un día por la mitad
    const ultimoDia = pagina[pagina.length - 1].fecha;
    const delUltimoDia = await prisma.diarioEntrada.findMany({ where: { AND: [base, { fecha: ultimoDia }] }, include: incluir });
    pagina = [...pagina.filter((e) => e.fecha.getTime() !== ultimoDia.getTime()), ...delUltimoDia];
    siguiente = escribirCursor({ tipo: "fecha", fecha: aClave(ultimoDia) });
  }
  const items = pagina
    .map((e) => ({ e, hora: e.hora ?? minutosEnFamilia(e.creadaEn) }))
    .sort((a, b) => (a.e.fecha.getTime() === b.e.fecha.getTime() ? compararEnElDia({ hora: a.hora, creadaEn: a.e.creadaEn.toISOString(), id: a.e.id }, { hora: b.hora, creadaEn: b.e.creadaEn.toISOString(), id: b.e.id }, desc) : desc ? b.e.fecha.getTime() - a.e.fecha.getTime() : a.e.fecha.getTime() - b.e.fecha.getTime()))
    .map(({ e, hora }) => ({ entrada: aVista(e, actor), sello: { fecha: aClave(e.fecha), hora } }));

  const meses = [...new Set(items.map((i) => i.sello.fecha.slice(0, 7)))];
  const conteoMeses: Record<string, number> = {};
  await Promise.all(
    meses.map(async (mes) => {
      conteoMeses[mes] = await prisma.diarioEntrada.count({ where: { AND: [base, { fecha: { gte: aFecha(`${mes}-01`), lt: mesSiguiente(mes) } }] } });
    }),
  );
  return { items, siguiente, conteoMeses };
}

// ── Mismo día de otros años ──────────────────────────────────────────────────

/** storypad `ThrowbackViewModel.filter` / Daily You `isOnThisDayMatch`: las entradas de ese día y mes en todos los años, la más nueva primero. */
export async function enEsteDia(actor: Actor, tipo: TipoDiario, diaMes: string | null): Promise<{ diaMes: string; entradas: EntradaVista[] }> {
  const hoy = hoyEnFamilia();
  const dm = diaMes ?? hoy.slice(5);
  if (!esDiaMes(dm)) throw new Error("Día inválido");
  const donde = dondeBase(actor, tipo);
  const primera = (await prisma.diarioEntrada.aggregate({ where: donde, _min: { fecha: true } }))._min.fecha;
  if (!primera) return { diaMes: dm, entradas: [] };
  const fechas = fechasDelDiaMes(dm, Number(aClave(primera).slice(0, 4)), Number(hoy.slice(0, 4)));
  if (!fechas.length) return { diaMes: dm, entradas: [] };
  const filas = await prisma.diarioEntrada.findMany({ where: { AND: [donde, { fecha: { in: fechas.map(aFecha) } }] }, include: incluir });
  const entradas = filas
    .map((e) => ({ e, hora: e.hora ?? minutosEnFamilia(e.creadaEn) }))
    .sort((a, b) => (a.e.fecha.getTime() === b.e.fecha.getTime() ? compararEnElDia({ hora: a.hora, creadaEn: a.e.creadaEn.toISOString(), id: a.e.id }, { hora: b.hora, creadaEn: b.e.creadaEn.toISOString(), id: b.e.id }, true) : b.e.fecha.getTime() - a.e.fecha.getTime()))
    .map(({ e }) => aVista(e, actor));
  return { diaMes: dm, entradas };
}

// ── Recuerdos ────────────────────────────────────────────────────────────────

export interface GrupoRecuerdoVista {
  clave: ClaveRecuerdo;
  titulo: string;
  enEsteDia: boolean;
  entradas: { entrada: EntradaVista; etiqueta: string }[];
}

export interface RecuerdosVista {
  hoy: string;
  grupos: GrupoRecuerdoVista[];
  elegidos: EleccionesDelDia;
}

export async function recuerdosDelDia(actor: Actor, tipo: TipoDiario, opciones: Pick<OpcionesRecuerdos, "activos" | "sinMalos">, fijos: EleccionesDelDia | null): Promise<RecuerdosVista> {
  const hoy = hoyEnFamilia();
  const donde = dondeBase(actor, tipo);
  const filasDb = await prisma.diarioEntrada.findMany({ where: donde, select: { id: true, fecha: true, hora: true, creadaEn: true, animo: true }, orderBy: { id: "desc" }, take: MAX_FILAS });
  const filas: FilaRecuerdo[] = filasDb.map((e) => ({ id: e.id, fecha: aClave(e.fecha), hora: e.hora ?? minutosEnFamilia(e.creadaEn), animo: e.animo }));
  const r = calcularRecuerdos(filas, hoy, opciones, fijos);
  const ids = r.grupos.flatMap((g) => g.entradas.map((e) => e.id));
  const completas = ids.length ? await prisma.diarioEntrada.findMany({ where: { AND: [donde, { id: { in: ids } }] }, include: incluir }) : [];
  const porId = new Map(completas.map((e) => [e.id, aVista(e, actor)]));
  const grupos: GrupoRecuerdoVista[] = r.grupos
    .map((g) => ({ ...g, entradas: g.entradas.flatMap((e) => (porId.has(e.id) ? [{ entrada: porId.get(e.id)!, etiqueta: e.etiqueta }] : [])) }))
    .filter((g) => g.entradas.length > 0);
  return { hoy, grupos, elegidos: r.elegidos };
}
