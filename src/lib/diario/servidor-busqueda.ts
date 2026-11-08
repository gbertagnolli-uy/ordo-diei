// Diario (lane 285), lado servidor: búsqueda con filtros. La privacidad del personal se hace cumplir acá, en cada consulta (B2).
// Portado de vendor/moodiary/packages/feature_base/moodiary_data/lib/src/diary_repository.dart (`searchDiaries`, `countSearchDiaries`) (ZhuJHua/moodiary@2c552dd)
// y de vendor/storypad/lib/core/objects/search_filter_object.dart (theachoem/storypad@a76825e). Ver B1: el texto se compara en JS, sin tildes.
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { aClave, aFecha } from "@/lib/habitos/server";
import {
  MAX_CANDIDATAS,
  coincide,
  descendientes,
  extracto,
  ordenarHallazgos,
  prepararConsulta,
  puntuar,
  resaltar,
  type FiltroBusqueda,
  type Hallazgo,
  type Segmento,
} from "./busqueda";
import type { Actor } from "./etiquetas";
import type { TipoDiario } from "./reglas";
import { aVista, incluir, minutosEnFamilia, type EntradaVista } from "./servidor";

export interface HallazgoVista {
  entrada: EntradaVista;
  /** Título con las coincidencias marcadas (null = la entrada no tiene título). */
  titulo: Segmento[] | null;
  extracto: Segmento[];
}

export interface ResultadoBusqueda {
  hallazgos: HallazgoVista[];
  /** Total de entradas que cumplen (no solo las de esta página). */
  total: number;
  hayMas: boolean;
  milisegundos: number;
  /** Había más de `MAX_CANDIDATAS` entradas para comparar: se miraron las más recientes. */
  truncado: boolean;
  /** Cuántas de las entradas del resultado tienen cada etiqueta (storypad `storiesCount`). */
  etiquetas: { id: number; n: number }[];
  /** Años con entradas que cumplen todo menos el filtro de años (para poder elegir otros). */
  anios: { anio: number; n: number }[];
}

type Candidata = {
  id: number;
  fecha: Date;
  hora: number | null;
  creadaEn: Date;
  animo: number | null;
  titulo?: string | null;
  texto?: string;
  etiquetas?: { valor: string | null }[];
};

const valorNumerico = (v: string | null | undefined) => {
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

async function filtroSql(actor: Actor, tipo: TipoDiario, f: FiltroBusqueda): Promise<Prisma.DiarioEntradaWhereInput> {
  const y: Prisma.DiarioEntradaWhereInput[] = [];
  if (f.desde || f.hasta) y.push({ fecha: { ...(f.desde ? { gte: aFecha(f.desde) } : {}), ...(f.hasta ? { lte: aFecha(f.hasta) } : {}) } });
  if (f.animos.length) y.push({ animo: { in: f.animos } });
  if (f.favorita !== null) y.push({ favorita: f.favorita });
  if (f.fijada !== null) y.push({ fijada: f.fijada });
  if (f.sinCategoria) y.push({ categoriaId: null });
  else if (f.categoriaId !== null) {
    const todas = await prisma.diarioCategoria.findMany({
      where: { ambito: tipo, ...(tipo === "personal" ? { creadorId: actor.id } : {}) },
      select: { id: true, padreId: true },
    });
    y.push({ categoriaId: { in: descendientes(f.categoriaId, todas) } });
  }
  if (f.etiquetaModo === "ninguna") y.push({ etiquetas: { none: {} } });
  else if (f.etiquetas.length) {
    if (f.etiquetaModo === "todas") for (const id of f.etiquetas) y.push({ etiquetas: { some: { etiquetaId: id } } });
    else y.push({ etiquetas: { some: { etiquetaId: { in: f.etiquetas } } } });
  }
  return { tipo, ...(tipo === "personal" ? { autorId: actor.id } : {}), ...(y.length ? { AND: y } : {}) };
}

export async function buscarEntradas(actor: Actor, tipo: TipoDiario, f: FiltroBusqueda): Promise<ResultadoBusqueda> {
  const inicio = Date.now();
  const q = prepararConsulta(f.consulta);
  const conTexto = q.terminos.length > 0;
  const where = await filtroSql(actor, tipo, f);
  const filas = (await prisma.diarioEntrada.findMany({
    where,
    select: {
      id: true,
      fecha: true,
      hora: true,
      creadaEn: true,
      animo: true,
      ...(conTexto ? { titulo: true, texto: true } : {}),
      ...(f.orden === "contador" && f.contadorId ? { etiquetas: { where: { etiquetaId: f.contadorId }, select: { valor: true } } } : {}),
    },
    orderBy: [{ fecha: "desc" }, { creadaEn: "desc" }],
    take: MAX_CANDIDATAS + 1,
  })) as Candidata[];
  const truncado = filas.length > MAX_CANDIDATAS;

  const encontradas: Hallazgo[] = [];
  for (const c of truncado ? filas.slice(0, MAX_CANDIDATAS) : filas) {
    if (conTexto && !coincide(c.titulo ?? null, c.texto ?? "", q)) continue;
    encontradas.push({
      id: c.id,
      fecha: aClave(c.fecha),
      hora: c.hora ?? minutosEnFamilia(c.creadaEn),
      animo: c.animo,
      valor: valorNumerico(c.etiquetas?.[0]?.valor),
      puntaje: conTexto ? puntuar(c.titulo ?? null, c.texto ?? "", q) : 0,
    });
  }

  const porAnio = new Map<number, number>();
  for (const h of encontradas) porAnio.set(Number(h.fecha.slice(0, 4)), (porAnio.get(Number(h.fecha.slice(0, 4))) ?? 0) + 1);
  const anios = [...porAnio].map(([anio, n]) => ({ anio, n })).sort((a, b) => b.anio - a.anio);

  const filtradas = f.anios.length ? encontradas.filter((h) => f.anios.includes(Number(h.fecha.slice(0, 4)))) : encontradas;
  const ordenadas = ordenarHallazgos(filtradas, f.orden, f.sentido);
  const pagina = ordenadas.slice(f.desplazamiento, f.desplazamiento + f.limite);

  // Las entradas de la página, con todo (de nuevo con el filtro de privacidad)
  const completas = pagina.length
    ? await prisma.diarioEntrada.findMany({ where: { id: { in: pagina.map((h) => h.id) }, tipo, ...(tipo === "personal" ? { autorId: actor.id } : {}) }, include: incluir })
    : [];
  const porId = new Map(completas.map((e) => [e.id, e]));
  const hallazgos: HallazgoVista[] = [];
  for (const h of pagina) {
    const e = porId.get(h.id);
    if (!e) continue;
    hallazgos.push({
      entrada: aVista(e, actor),
      titulo: e.titulo ? resaltar(e.titulo, q.terminos) : null,
      extracto: extracto(e.texto, q.terminos),
    });
  }

  const conteo = ordenadas.length
    ? await prisma.diarioEntradaEtiqueta.groupBy({ by: ["etiquetaId"], where: { entradaId: { in: ordenadas.map((h) => h.id) } }, _count: { _all: true } })
    : [];

  return {
    hallazgos,
    total: ordenadas.length,
    hayMas: f.desplazamiento + pagina.length < ordenadas.length,
    milisegundos: Date.now() - inicio,
    truncado,
    etiquetas: conteo.map((c) => ({ id: c.etiquetaId, n: c._count._all })),
    anios,
  };
}
