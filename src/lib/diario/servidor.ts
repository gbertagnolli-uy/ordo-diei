// Diario (lane 272), lado servidor. La privacidad del personal se hace cumplir acá, en cada consulta (D1).
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { APP_TZ, aClave, aFecha, hoyEnFamilia, NoAutorizadoError, NoEncontradoError } from "@/lib/habitos/server";
import type { Clima } from "./clima";
import type { NodoDoc } from "./contenido";
import type { EtiquetaPuesta } from "./etiquetas";
import { aplicarEnlaces } from "./servidor-enlaces";
import { prepararEtiquetas, verificarCategoria } from "./servidor-catalogo";
import { verificarLugar } from "./servidor-lugares";
import { MAX_ENTRADAS_DIA, puedeBorrar, puedeEditar, validarEntrada, validarMarcas, type TipoDiario } from "./reglas";

type Actor = { id: number; esPadre: boolean };

export type EntradaVista = {
  id: number;
  tipo: TipoDiario;
  fecha: string;
  titulo: string | null;
  texto: string;
  /** Documento Tiptap; null = entrada escrita en texto plano (lane 272), se abre como párrafos. */
  contenido: NodoDoc | null;
  animo: number | null;
  /** Lane 284: etiquetas puestas (el nombre, ícono y color salen del catálogo) y categoría de la entrada. */
  etiquetas: EtiquetaPuesta[];
  categoriaId: number | null;
  /** Lane 296: lugar frecuente (el nombre, ícono y coordenadas salen de `/api/diario/lugares`) y clima de la entrada. */
  lugarId: number | null;
  clima: Clima | null;
  /** Lane 285: marcas de la entrada (storypad `starred` y `pinned`). */
  favorita: boolean;
  fijada: boolean;
  /** Hora de la entrada: minutos desde la medianoche en la zona de la familia (la fijada o, si no, la de `creadaEn`). */
  hora: number;
  creadaEn: string;
  editadaEn: string;
  fotos: string[];
  /** Lane 290: cuántas entradas enlaza ésta y cuántas la enlazan (para mostrar el panel de enlaces). */
  enlaces: number;
  autor: { id: number; nombre: string; fotoUrl: string | null };
  puedoEditar: boolean;
  puedoBorrar: boolean;
};

export const incluir = {
  etiquetas: { select: { etiquetaId: true, valor: true }, orderBy: { id: "asc" as const } },
  fotos: { orderBy: { orden: "asc" as const }, select: { url: true } },
  autor: { select: { id: true, nombre: true, fotoUrl: true } },
  _count: { select: { enlacesSalientes: true, enlacesEntrantes: true } },
};

export type EntradaConFotos = Prisma.DiarioEntradaGetPayload<{ include: typeof incluir }>;

/** Las tres columnas del clima (moodiary `weather_icon` / `weather_temp` / `weather_text`); null las borra. */
export const columnasClima = (c: Clima | null) => ({ climaCodigo: c ? c.codigo : null, climaTemp: c ? c.temp : null, climaTexto: c ? c.texto : null });

const aJson = (d: NodoDoc | null) => (d ? (d as unknown as Prisma.InputJsonObject) : undefined);

/** Minutos desde la medianoche, en la zona de la familia. */
export const minutosEnFamilia = (d: Date) => {
  const [h, m] = format(d, "HH:mm", { in: tz(APP_TZ) }).split(":").map(Number);
  return h * 60 + m;
};

export function aVista(e: EntradaConFotos, actor: Actor): EntradaVista {
  return {
    id: e.id,
    tipo: e.tipo,
    fecha: aClave(e.fecha),
    titulo: e.titulo,
    texto: e.texto,
    contenido: (e.contenido as NodoDoc | null) ?? null,
    animo: e.animo,
    etiquetas: e.etiquetas.map((t) => ({ id: t.etiquetaId, valor: t.valor })),
    categoriaId: e.categoriaId,
    lugarId: e.lugarId,
    clima: e.climaCodigo ? { codigo: e.climaCodigo, temp: e.climaTemp, texto: e.climaTexto ?? "" } : null,
    favorita: e.favorita,
    fijada: e.fijada,
    hora: e.hora ?? minutosEnFamilia(e.creadaEn),
    creadaEn: e.creadaEn.toISOString(),
    editadaEn: e.editadaEn.toISOString(),
    fotos: e.fotos.map((f: { url: string }) => f.url),
    enlaces: e._count.enlacesSalientes + e._count.enlacesEntrantes,
    autor: e.autor,
    puedoEditar: puedeEditar(e, actor),
    puedoBorrar: puedeBorrar(e, actor),
  };
}

/** Entradas de un mes ("YYYY-MM"). Personal: solo las propias. */
export async function listarMes(actor: Actor, tipo: TipoDiario, mes: string): Promise<EntradaVista[]> {
  if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error("Mes inválido");
  const [y, m] = mes.split("-").map(Number);
  const desde = aFecha(`${mes}-01`);
  const hasta = new Date(Date.UTC(y, m, 1));
  const filas = await prisma.diarioEntrada.findMany({
    where: { tipo, fecha: { gte: desde, lt: hasta }, ...(tipo === "personal" ? { autorId: actor.id } : {}) },
    orderBy: [{ fecha: "desc" }, { creadaEn: "desc" }],
    include: incluir,
  });
  return filas
    .map((e) => aVista(e, actor))
    .sort((a, b) => (a.fecha === b.fecha ? b.hora - a.hora || b.creadaEn.localeCompare(a.creadaEn) : b.fecha.localeCompare(a.fecha)));
}

export async function crearEntrada(actor: Actor, tipo: TipoDiario, body: Record<string, unknown>): Promise<EntradaVista> {
  const v = validarEntrada(body, hoyEnFamilia());
  const fecha = aFecha(v.fecha);
  const delDia = await prisma.diarioEntrada.count({ where: { autorId: actor.id, fecha } });
  if (delDia >= MAX_ENTRADAS_DIA) throw new Error("Llegaste al máximo de entradas de este día");
  const e = await prisma.$transaction(async (tx) => {
    const etiquetas = await prepararEtiquetas(tx, actor, tipo, v.etiquetas ?? []);
    if (v.categoriaId != null) await verificarCategoria(tx, actor, tipo, v.categoriaId);
    if (v.lugarId != null) await verificarLugar(tx, actor, tipo, v.lugarId);
    const creada = await tx.diarioEntrada.create({
      data: {
        tipo,
        autorId: actor.id,
        fecha,
        titulo: v.titulo,
        texto: v.texto,
        contenido: aJson(v.contenido),
        hora: v.hora,
        animo: v.animo,
        categoriaId: v.categoriaId ?? null,
        lugarId: v.lugarId ?? null,
        ...columnasClima(v.clima ?? null),
        favorita: v.favorita ?? false,
        fijada: v.fijada ?? false,
        fotos: { create: v.fotos.map((url, orden) => ({ url, orden })) },
        etiquetas: { create: etiquetas.map((t) => ({ etiquetaId: t.id, valor: t.valor })) },
      },
      select: { id: true },
    });
    await aplicarEnlaces(tx, creada.id, tipo, actor.id, v.contenido);
    return tx.diarioEntrada.findUniqueOrThrow({ where: { id: creada.id }, include: incluir });
  });
  return aVista(e, actor);
}

async function buscarVisible(actor: Actor, id: number) {
  const e = await prisma.diarioEntrada.findUnique({ where: { id }, include: incluir });
  // Una entrada personal ajena responde «no existe» (no se revela que existe)
  if (!e || (e.tipo === "personal" && e.autorId !== actor.id)) throw new NoEncontradoError("La entrada no existe");
  return e;
}

export async function editarEntrada(actor: Actor, id: number, body: Record<string, unknown>): Promise<EntradaVista> {
  const e = await buscarVisible(actor, id);
  if (!puedeEditar(e, actor)) throw new NoAutorizadoError("Solo quien la escribió puede editarla");
  const v = validarEntrada({ ...body, fecha: body.fecha ?? aClave(e.fecha), hora: body.hora ?? e.hora }, hoyEnFamilia());
  const nueva = await prisma.$transaction(async (tx) => {
    await tx.diarioFoto.deleteMany({ where: { entradaId: id } });
    // Las etiquetas se validan contra el ámbito de la entrada; si el cuerpo no las trae, quedan como estaban
    const etiquetas = v.etiquetas ? await prepararEtiquetas(tx, actor, e.tipo, v.etiquetas) : undefined;
    if (etiquetas) await tx.diarioEntradaEtiqueta.deleteMany({ where: { entradaId: id } });
    if (v.categoriaId != null) await verificarCategoria(tx, actor, e.tipo, v.categoriaId);
    if (v.lugarId != null) await verificarLugar(tx, actor, e.tipo, v.lugarId);
    await tx.diarioEntrada.update({
      where: { id },
      data: {
        fecha: aFecha(v.fecha),
        titulo: v.titulo,
        texto: v.texto,
        contenido: aJson(v.contenido) ?? Prisma.DbNull,
        hora: v.hora,
        animo: v.animo,
        ...(v.categoriaId !== undefined ? { categoriaId: v.categoriaId } : {}),
        ...(v.lugarId !== undefined ? { lugarId: v.lugarId } : {}),
        ...(v.clima !== undefined ? columnasClima(v.clima) : {}),
        ...(v.favorita !== undefined ? { favorita: v.favorita } : {}),
        ...(v.fijada !== undefined ? { fijada: v.fijada } : {}),
        fotos: { create: v.fotos.map((url, orden) => ({ url, orden })) },
        ...(etiquetas ? { etiquetas: { create: etiquetas.map((t) => ({ etiquetaId: t.id, valor: t.valor })) } } : {}),
      },
      select: { id: true },
    });
    await aplicarEnlaces(tx, id, e.tipo, e.autorId, v.contenido);
    return tx.diarioEntrada.findUniqueOrThrow({ where: { id }, include: incluir });
  });
  return aVista(nueva, actor);
}

/** Estrella y chincheta sin tocar el resto de la entrada (lane 285). Las cambia quien la escribió. */
export async function cambiarMarcas(actor: Actor, id: number, body: Record<string, unknown>): Promise<EntradaVista> {
  const e = await buscarVisible(actor, id);
  if (!puedeEditar(e, actor)) throw new NoAutorizadoError("Solo quien la escribió puede marcarla");
  const marcas = validarMarcas(body, true);
  const nueva = await prisma.diarioEntrada.update({ where: { id }, data: { ...marcas, editadaEn: e.editadaEn }, include: incluir }); // marcar no cuenta como editar
  return aVista(nueva, actor);
}

export async function borrarEntrada(actor: Actor, id: number): Promise<void> {
  const e = await buscarVisible(actor, id);
  if (!puedeBorrar(e, actor)) throw new NoAutorizadoError("No podés borrar esta entrada");
  await prisma.diarioEntrada.delete({ where: { id } });
}
