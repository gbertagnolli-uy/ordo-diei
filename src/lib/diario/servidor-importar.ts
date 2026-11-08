// Diario (lane 292), lado servidor: escribe el catálogo y las entradas que manda el navegador por lotes.
// La privacidad del personal se hace cumplir acá (D1): se escribe siempre a nombre de quien lo pide, en el diario que se eligió.
// Portado de vendor/Daily_You/lib/utils/imports/import_writer.dart (Demizo/Daily_You@7cc237d): categorías y etiquetas por nombre sin repetir,
// y una entrada que ya está (misma fecha y hora de creación) no se vuelve a escribir.
import { format } from "date-fns";
import { tz, TZDate } from "@date-fns/tz";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { APP_TZ, hoyEnFamilia } from "@/lib/habitos/server";
import { claveDeUrl } from "@/lib/archivos";
import { archivosDe, imagenesDe, type NodoDoc } from "./contenido";
import { reescribirImagenes } from "./exportar";
import { validarClima, type Clima } from "./clima";
import { MAX_ETIQUETAS_ENTRADA, type Actor, type EtiquetaPuesta } from "./etiquetas";
import { lugarDeFrontMatter, type LugarImport } from "./lugares";
import { claveEtiqueta, claveNombre, partesDeCamino, type CatalogoImport } from "./importar/catalogo";
import type { RechazoLote, ResultadoCatalogo, ResultadoLote } from "./importar/lote";
import { MAX_ENTRADAS_LOTE } from "./importar/lote";
import { MAX_ENTRADAS_DIA, MAX_FOTOS, MAX_TITULO, validarEntrada, type TipoDiario } from "./reglas";
import { crear, prepararEtiquetas } from "./servidor-catalogo";
import { resolverLugarImportado } from "./servidor-lugares";
import { columnasClima, minutosEnFamilia } from "./servidor";

const alcance = (actor: Actor, tipo: TipoDiario) => ({ ambito: tipo, ...(tipo === "personal" ? { creadorId: actor.id } : {}) });
const esObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const texto = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const mensaje = (e: unknown) => (e instanceof Error ? e.message : "Error");

/** Un ícono o color que esta app no acepta no impide crear la etiqueta: se reintenta sin ellos. */
async function crearConReintento(actor: Actor, tipo: TipoDiario, recurso: "grupos" | "etiquetas", cuerpo: Record<string, unknown>): Promise<number> {
  try {
    return await crear(actor, tipo, recurso, cuerpo);
  } catch {
    return crear(actor, tipo, recurso, { ...cuerpo, icono: null, tipoIcono: "emoji", color: null });
  }
}

// ── Catálogo ─────────────────────────────────────────────────────────────────

/** Crea lo que falta (por nombre, sin mayúsculas) y deja lo que ya está como estaba. */
export async function prepararCatalogoImport(actor: Actor, tipo: TipoDiario, crudo: unknown): Promise<ResultadoCatalogo> {
  const c = (esObj(crudo) ? crudo : {}) as Partial<Record<keyof CatalogoImport, unknown>>;
  const res: ResultadoCatalogo = { grupos: 0, etiquetas: 0, categorias: 0, avisos: [] };
  const donde = alcance(actor, tipo);
  const [grupos, etiquetas, categorias] = await Promise.all([
    prisma.diarioGrupoEtiquetas.findMany({ where: donde, select: { id: true, nombre: true } }),
    prisma.diarioEtiqueta.findMany({ where: donde, select: { id: true, nombre: true, tipo: true } }),
    prisma.diarioCategoria.findMany({ where: donde, select: { id: true, nombre: true, padreId: true } }),
  ]);
  const grupoId = new Map(grupos.map((g) => [claveNombre(g.nombre), g.id]));
  const etiquetaId = new Map(etiquetas.map((e) => [claveEtiqueta(e.tipo, e.nombre), e.id]));
  const fallos = new Set<string>();
  const falla = (que: string, e: unknown) => fallos.add(`${que}: ${mensaje(e)}`);

  for (const g of Array.isArray(c.grupos) ? c.grupos : []) {
    if (!esObj(g) || !texto(g.nombre) || grupoId.has(claveNombre(String(g.nombre)))) continue;
    try {
      grupoId.set(claveNombre(String(g.nombre)), await crearConReintento(actor, tipo, "grupos", g));
      res.grupos++;
    } catch (e) {
      falla("categoría de etiquetas", e);
    }
  }
  for (const t of Array.isArray(c.etiquetas) ? c.etiquetas : []) {
    if (!esObj(t) || !texto(t.nombre) || (t.tipo !== "etiqueta" && t.tipo !== "contador") || etiquetaId.has(claveEtiqueta(t.tipo, String(t.nombre)))) continue;
    try {
      const g = texto(t.grupo) ? grupoId.get(claveNombre(String(t.grupo))) : undefined;
      etiquetaId.set(claveEtiqueta(t.tipo, String(t.nombre)), await crearConReintento(actor, tipo, "etiquetas", { ...t, grupoId: g ?? null }));
      res.etiquetas++;
    } catch (e) {
      falla("etiqueta", e);
    }
  }
  // Categorías: cada nivel cuelga del anterior
  const porCamino = new Map<string, number>();
  const caminoDe = (id: number): string => {
    const nombres: string[] = [];
    for (let f = categorias.find((x) => x.id === id), n = 0; f && n < 10; f = f.padreId === null ? undefined : categorias.find((x) => x.id === f!.padreId), n++) nombres.unshift(f.nombre);
    return nombres.join(" › ");
  };
  for (const cat of categorias) porCamino.set(claveNombre(caminoDe(cat.id)), cat.id);
  for (const k of Array.isArray(c.categorias) ? c.categorias : []) {
    if (!esObj(k) || !texto(k.camino)) continue;
    let padre: number | null = null;
    let camino = "";
    const partes = partesDeCamino(String(k.camino));
    for (let i = 0; i < partes.length; i++) {
      camino = camino ? `${camino} › ${partes[i]}` : partes[i];
      const existente = porCamino.get(claveNombre(camino));
      if (existente !== undefined) {
        padre = existente;
        continue;
      }
      try {
        const id: number = await crear(actor, tipo, "categorias", { nombre: partes[i], padreId: padre, color: i === partes.length - 1 ? (k.color ?? null) : null });
        porCamino.set(claveNombre(camino), id);
        categorias.push({ id, nombre: partes[i], padreId: padre });
        padre = id;
        res.categorias++;
      } catch (e) {
        falla("categoría", e);
        break;
      }
    }
  }
  res.avisos = [...fallos].slice(0, 5);
  return res;
}

// ── Entradas ─────────────────────────────────────────────────────────────────

interface EntradaLeida {
  fecha: string | null;
  hora: number | null;
  instante: Date | null;
  titulo: string | null;
  texto: string;
  contenido: unknown;
  animo: number | null;
  categoria: string | null;
  etiquetas: { nombre: string; tipo: "etiqueta" | "contador"; valor: string | null }[];
  lugar: LugarImport | null;
  clima: Clima | null;
  favorita: boolean;
  fijada: boolean;
  fotos: string[];
}

/** El clima que trae el lote: si no se entiende, la entrada se importa sin él (no se rechaza). */
function climaLeido(v: unknown): Clima | null {
  try {
    return validarClima(v) ?? null;
  } catch {
    return null;
  }
}

function leerEntrada(x: unknown): EntradaLeida {
  if (!esObj(x)) throw new Error("Entrada inválida");
  const instante = texto(x.instante) ? new Date(String(x.instante)) : null;
  if (instante && Number.isNaN(instante.getTime())) throw new Error("Fecha inválida");
  return {
    fecha: texto(x.fecha),
    hora: typeof x.hora === "number" && Number.isInteger(x.hora) ? x.hora : null,
    instante,
    titulo: texto(x.titulo)?.trim().slice(0, MAX_TITULO) ?? null,
    texto: typeof x.texto === "string" ? x.texto : "",
    contenido: x.contenido ?? null,
    animo: typeof x.animo === "number" ? x.animo : null,
    categoria: texto(x.categoria),
    etiquetas: (Array.isArray(x.etiquetas) ? x.etiquetas : []).flatMap((t) =>
      esObj(t) && texto(t.nombre) && (t.tipo === "etiqueta" || t.tipo === "contador") ? [{ nombre: String(t.nombre), tipo: t.tipo, valor: t.valor == null ? null : String(t.valor) }] : [],
    ),
    lugar: esObj(x.lugar) ? lugarDeFrontMatter({ latitude: x.lugar.latitud, longitude: x.lugar.longitud, name: x.lugar.nombre }) : null,
    clima: climaLeido(x.clima),
    favorita: x.favorita === true,
    fijada: x.fijada === true,
    fotos: (Array.isArray(x.fotos) ? x.fotos : []).filter((f): f is string => typeof f === "string"),
  };
}

/** Una entrada de fecha sin hora se pone al mediodía (I11), para que no figure a la medianoche. */
const HORA_SIN_HORA = 12 * 60;

export async function importarLote(actor: Actor, tipo: TipoDiario, crudas: unknown): Promise<ResultadoLote> {
  if (!Array.isArray(crudas)) throw new Error("Lote inválido");
  if (crudas.length > MAX_ENTRADAS_LOTE) throw new Error(`Hasta ${MAX_ENTRADAS_LOTE} entradas por lote`);
  const res: ResultadoLote = { creadas: 0, duplicadas: 0, rechazadas: [] };
  const rechazar = (indice: number, motivo: string) => res.rechazadas.push({ indice, motivo } satisfies RechazoLote);
  const hoy = hoyEnFamilia();
  const donde = alcance(actor, tipo);

  // Catálogo, una vez por lote
  const [etiquetas, categorias] = await Promise.all([
    prisma.diarioEtiqueta.findMany({ where: donde, select: { id: true, nombre: true, tipo: true } }),
    prisma.diarioCategoria.findMany({ where: donde, select: { id: true, nombre: true, padreId: true } }),
  ]);
  const etiquetaId = new Map(etiquetas.map((e) => [claveEtiqueta(e.tipo, e.nombre), e.id]));
  const caminoDe = (id: number): string => {
    const nombres: string[] = [];
    for (let f = categorias.find((x) => x.id === id), n = 0; f && n < 10; f = f.padreId === null ? undefined : categorias.find((x) => x.id === f!.padreId), n++) nombres.unshift(f.nombre);
    return nombres.join(" › ");
  };
  const categoriaId = new Map(categorias.map((c) => [claveNombre(caminoDe(c.id)), c.id]));
  // Lane 296: los lugares del diario, para reusar por nombre o por cercanía (moodiary `_resolvePlace`)
  const lugares = (await prisma.diarioLugar.findMany({ where: donde, select: { id: true, nombre: true, latitud: true, longitud: true } })).map((l) => ({ ...l }));

  // Fecha, hora y momento de creación de cada una
  interface Lista {
    indice: number;
    e: EntradaLeida;
    fecha: string;
    hora: number | null;
    creadaEn: Date;
  }
  const listas: Lista[] = [];
  crudas.forEach((x, indice) => {
    try {
      const e = leerEntrada(x);
      let fecha = e.fecha;
      let hora = e.hora;
      if (!fecha && e.instante) {
        fecha = format(e.instante, "yyyy-MM-dd", { in: tz(APP_TZ) });
        hora = hora ?? minutosEnFamilia(e.instante);
      }
      fecha ??= hoy;
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
      if (!m) throw new Error("Fecha inválida");
      const minutos = hora ?? (e.instante ? minutosEnFamilia(e.instante) : HORA_SIN_HORA);
      const creadaEn = e.instante ?? new Date(new TZDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Math.floor(minutos / 60), minutos % 60, 0, APP_TZ).getTime());
      listas.push({ indice, e, fecha, hora, creadaEn });
    } catch (err) {
      rechazar(indice, mensaje(err));
    }
  });
  if (!listas.length) return res;

  // Las que ya están: mismo autor, mismo diario, misma hora de creación y mismo texto
  const existentes = await prisma.diarioEntrada.findMany({
    where: { tipo, autorId: actor.id, creadaEn: { in: listas.map((l) => l.creadaEn) } },
    select: { creadaEn: true, titulo: true, texto: true },
  });
  const yaEsta = new Set(existentes.map((x) => `${x.creadaEn.getTime()}|${x.titulo ?? ""}|${x.texto}`));

  // Archivos que existen de verdad (una imagen de otro entorno no se muestra)
  const claves = new Set<string>();
  for (const l of listas) {
    for (const u of l.e.fotos) {
      const c = claveDeUrl(u);
      if (c) claves.add(c);
    }
    // Lane 294: también los audios, videos y adjuntos del documento
    if (esObj(l.e.contenido)) for (const u of [...imagenesDe(l.e.contenido as unknown as NodoDoc), ...archivosDe(l.e.contenido as unknown as NodoDoc).map((a) => a.src)]) {
      const c = claveDeUrl(u);
      if (c) claves.add(c);
    }
  }
  const hay = new Set((claves.size ? await prisma.archivo.findMany({ where: { clave: { in: [...claves] } }, select: { clave: true } }) : []).map((a) => a.clave));
  const existe = (u: string) => hay.has(claveDeUrl(u) ?? "");

  // Cuántas hay ya por día
  const dias = [...new Set(listas.map((l) => l.fecha))];
  const porDia = new Map<string, number>();
  const cuentas = await prisma.diarioEntrada.groupBy({ by: ["fecha"], where: { autorId: actor.id, fecha: { in: dias.map((d) => new Date(`${d}T00:00:00.000Z`)) } }, _count: { _all: true } });
  for (const c of cuentas) porDia.set(c.fecha.toISOString().slice(0, 10), c._count._all);

  for (const { indice, e, fecha, hora, creadaEn } of listas) {
    try {
      const puestas: EtiquetaPuesta[] = [];
      for (const t of e.etiquetas) {
        const id = etiquetaId.get(claveEtiqueta(t.tipo, t.nombre));
        if (id !== undefined && !puestas.some((p) => p.id === id) && puestas.length < MAX_ETIQUETAS_ENTRADA) puestas.push({ id, valor: t.tipo === "contador" ? t.valor : null });
      }
      let contenido = e.contenido;
      if (esObj(contenido)) contenido = reescribirImagenes(contenido as unknown as NodoDoc, (src) => (src.startsWith("/api/archivos/") && !existe(src) ? null : src));
      const v = validarEntrada(
        { fecha, hora, titulo: e.titulo, texto: e.texto, contenido, animo: e.animo, fotos: e.fotos.filter(existe).slice(0, MAX_FOTOS), etiquetas: puestas, favorita: e.favorita, fijada: e.fijada },
        hoy,
      );
      if (yaEsta.has(`${creadaEn.getTime()}|${v.titulo ?? ""}|${v.texto}`)) {
        res.duplicadas++;
        continue;
      }
      if ((porDia.get(fecha) ?? 0) >= MAX_ENTRADAS_DIA) throw new Error("Ya hay el máximo de entradas de ese día");
      const catId = e.categoria ? (categoriaId.get(claveNombre(partesDeCamino(e.categoria).join(" › "))) ?? null) : null;
      const lugaresNuevos: { id: number; nombre: string; latitud: number; longitud: number }[] = [];
      await prisma.$transaction(async (tx) => {
        const etiquetasOk = await prepararEtiquetas(tx, actor, tipo, v.etiquetas ?? []);
        // Un lugar que no se puede crear (por ejemplo, el tope) no impide importar la entrada
        let lugarId: number | null = null;
        if (e.lugar) {
          try {
            const r = await resolverLugarImportado(tx, actor, tipo, lugares, e.lugar);
            lugarId = r.id;
            if (r.nuevo) lugaresNuevos.push(r.nuevo);
          } catch {
            lugarId = null;
          }
        }
        await tx.diarioEntrada.create({
          data: {
            tipo,
            autorId: actor.id,
            fecha: new Date(`${fecha}T00:00:00.000Z`),
            titulo: v.titulo,
            texto: v.texto,
            contenido: v.contenido ? (v.contenido as unknown as Prisma.InputJsonObject) : undefined,
            hora: v.hora ?? (e.instante ? null : HORA_SIN_HORA),
            animo: v.animo,
            categoriaId: catId,
            lugarId,
            ...columnasClima(e.clima),
            favorita: v.favorita ?? false,
            fijada: v.fijada ?? false,
            creadaEn,
            editadaEn: creadaEn,
            fotos: { create: v.fotos.map((url, orden) => ({ url, orden })) },
            etiquetas: { create: etiquetasOk.map((t) => ({ etiquetaId: t.id, valor: t.valor })) },
          },
          select: { id: true },
        });
      });
      lugares.push(...lugaresNuevos);
      yaEsta.add(`${creadaEn.getTime()}|${v.titulo ?? ""}|${v.texto}`);
      porDia.set(fecha, (porDia.get(fecha) ?? 0) + 1);
      res.creadas++;
    } catch (err) {
      rechazar(indice, mensaje(err));
    }
  }
  return res;
}
