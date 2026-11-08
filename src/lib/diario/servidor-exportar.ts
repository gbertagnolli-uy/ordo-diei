// Diario (lane 291), lado servidor: arma el archivo de la exportación (Markdown, CSV o JSON, con o sin fotos).
// La privacidad del personal se hace cumplir acá, en cada consulta (D1): el personal exporta solo lo del autor; el familiar, lo de toda la familia.
// Portado de vendor/Daily_You/lib/utils/exports/{export_runner,export_snapshot}.dart (Demizo/Daily_You@7cc237d)
// y de vendor/moodiary/packages/feature/moodiary_export/lib/src/data/export_scope.dart (ZhuJHua/moodiary@2c552dd).
import { strToU8, zipSync, type Zippable } from "fflate";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { aClave, aFecha, hoyEnFamilia } from "@/lib/habitos/server";
import { claveDeUrl } from "@/lib/archivos";
import { descendientes } from "./busqueda";
import { imagenesDe, type NodoDoc } from "./contenido";
import {
  MAX_BYTES_FOTOS_EXPORT,
  MAX_ENTRADAS_EXPORT,
  documentoJson,
  csvDeEntradas,
  extensionDeImagen,
  markdownUnido,
  nombrarEntradas,
  nombreDeArchivo,
  notaMarkdown,
  type CatalogoExport,
  type DatosExport,
  type EntradaExport,
  type FormatoExport,
} from "./exportar";
import type { Actor } from "./etiquetas";
import { SIN_CATEGORIA } from "./linea";
import type { TipoDiario } from "./reglas";
import { listarCatalogo } from "./servidor-catalogo";
import { leerEscala } from "./servidor-escala";
import { incluir, minutosEnFamilia } from "./servidor";

export interface OpcionesExportar {
  formato: FormatoExport;
  /** "YYYY-MM-DD", incluida. */
  desde: string | null;
  hasta: string | null;
  categoria: number | typeof SIN_CATEGORIA | null;
  fotos: boolean;
  /** Markdown: todo en un solo archivo en vez de una nota por entrada. */
  unir: boolean;
}

export interface ArchivoExportado {
  datos: string | Uint8Array;
  nombre: string;
  mime: string;
}

class ExportacionError extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.status = status;
  }
}

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Lee los parámetros de la URL; lanza con un mensaje claro si algo no es válido. */
export function leerOpciones(p: URLSearchParams, formato: FormatoExport): OpcionesExportar {
  const fecha = (k: string) => {
    const v = p.get(k);
    if (!v) return null;
    if (!RE_FECHA.test(v) || Number.isNaN(aFecha(v).getTime())) throw new ExportacionError(`Fecha inválida (${k})`);
    return v;
  };
  const desde = fecha("desde");
  const hasta = fecha("hasta");
  if (desde && hasta && desde > hasta) throw new ExportacionError("«Desde» es posterior a «hasta»");
  const crudo = p.get("categoria");
  let categoria: OpcionesExportar["categoria"] = null;
  if (crudo === SIN_CATEGORIA) categoria = SIN_CATEGORIA;
  else if (crudo) {
    const n = Number(crudo);
    if (!Number.isInteger(n) || n <= 0) throw new ExportacionError("Categoría inválida");
    categoria = n;
  }
  return { formato, desde, hasta, categoria, fotos: p.get("fotos") === "1", unir: p.get("unir") === "1" };
}

async function dondeDe(actor: Actor, tipo: TipoDiario, o: OpcionesExportar): Promise<Prisma.DiarioEntradaWhereInput> {
  const y: Prisma.DiarioEntradaWhereInput[] = [{ tipo, ...(tipo === "personal" ? { autorId: actor.id } : {}) }];
  if (o.desde || o.hasta) y.push({ fecha: { ...(o.desde ? { gte: aFecha(o.desde) } : {}), ...(o.hasta ? { lte: aFecha(o.hasta) } : {}) } });
  if (o.categoria === SIN_CATEGORIA) y.push({ categoriaId: null });
  else if (o.categoria !== null) {
    const todas = await prisma.diarioCategoria.findMany({ where: { ambito: tipo, ...(tipo === "personal" ? { creadorId: actor.id } : {}) }, select: { id: true, padreId: true } });
    if (!todas.some((c) => c.id === o.categoria)) throw new ExportacionError("La categoría no existe", 404);
    y.push({ categoriaId: { in: descendientes(o.categoria, todas) } });
  }
  return { AND: y };
}

export async function exportarDiario(actor: Actor, tipo: TipoDiario, o: OpcionesExportar): Promise<ArchivoExportado> {
  const donde = await dondeDe(actor, tipo, o);
  const total = await prisma.diarioEntrada.count({ where: donde });
  if (total === 0) throw new ExportacionError("No hay entradas para exportar con ese filtro", 404);
  if (total > MAX_ENTRADAS_EXPORT) throw new ExportacionError(`Son ${total} entradas y el máximo por exportación es ${MAX_ENTRADAS_EXPORT}. Elegí un rango de fechas más corto.`, 413);

  const [filas, cat, escala] = await Promise.all([
    prisma.diarioEntrada.findMany({ where: donde, orderBy: [{ fecha: "asc" }, { id: "asc" }], include: incluir }),
    listarCatalogo(actor, tipo),
    leerEscala(actor, tipo),
  ]);

  // Catálogo legible: categorías con su camino completo («Fe › Misa»)
  const catPorId = new Map(cat.categorias.map((c) => [c.id, c]));
  const camino = (id: number | null): string | null => {
    const nombres: string[] = [];
    for (let c = id === null ? undefined : catPorId.get(id), n = 0; c && n < 10; c = c.padreId === null ? undefined : catPorId.get(c.padreId), n++) nombres.unshift(c.nombre);
    return nombres.length ? nombres.join(" › ") : null;
  };
  const grupoPorId = new Map(cat.grupos.map((g) => [g.id, g.nombre]));
  const etiquetaPorId = new Map(cat.etiquetas.map((e) => [e.id, e]));
  const catalogo: CatalogoExport = {
    escala,
    grupos: cat.grupos.map((g) => ({ nombre: g.nombre, icono: g.icono, tipoIcono: g.tipoIcono, color: g.color, seleccionUnica: g.seleccionUnica, orden: g.orden })),
    categorias: cat.categorias.map((c) => ({ nombre: c.nombre, camino: camino(c.id) ?? c.nombre, color: c.color })),
    etiquetas: cat.etiquetas.map((e) => ({ nombre: e.nombre, tipo: e.tipo, grupo: e.grupoId === null ? null : (grupoPorId.get(e.grupoId) ?? null), icono: e.icono, tipoIcono: e.tipoIcono, color: e.color, orden: e.orden })),
  };

  // Fotos: las de la entrada y las imágenes del documento, sin repetir; solo las que están guardadas en la base
  const urlsDe = (contenido: NodoDoc | null, fotos: string[]) => [...new Set([...fotos, ...(contenido ? imagenesDe(contenido) : [])])];
  const claves = new Set<string>();
  if (o.fotos) for (const f of filas) for (const u of urlsDe((f.contenido as NodoDoc | null) ?? null, f.fotos.map((x) => x.url))) {
    const c = claveDeUrl(u);
    if (c) claves.add(c);
  }
  const archivos = claves.size ? await prisma.archivo.findMany({ where: { clave: { in: [...claves] } }, select: { clave: true, tipo: true, bytes: true } }) : [];
  const bytesTotales = archivos.reduce((s, a) => s + a.bytes, 0);
  if (bytesTotales > MAX_BYTES_FOTOS_EXPORT) {
    throw new ExportacionError(`Las fotos pesan ${Math.round(bytesTotales / 1048576)} MB y el máximo es ${MAX_BYTES_FOTOS_EXPORT / 1048576} MB. Exportá sin fotos o con un rango más corto.`, 413);
  }
  const archivoPorClave = new Map(archivos.map((a) => [a.clave, a]));
  const extension = (u: string) => extensionDeImagen(archivoPorClave.get(claveDeUrl(u) ?? "")?.tipo ?? "");

  const entradas: EntradaExport[] = filas.map((f) => {
    const contenido = (f.contenido as NodoDoc | null) ?? null;
    return {
      fecha: aClave(f.fecha),
      hora: f.hora ?? minutosEnFamilia(f.creadaEn),
      titulo: f.titulo,
      texto: f.texto,
      contenido,
      animo: f.animo,
      categoria: camino(f.categoriaId),
      etiquetas: f.etiquetas.flatMap((t) => {
        const e = etiquetaPorId.get(t.etiquetaId);
        return e ? [{ nombre: e.nombre, tipo: e.tipo, valor: t.valor }] : [];
      }),
      favorita: f.favorita,
      fijada: f.fijada,
      autor: f.autor.nombre,
      creadaEn: f.creadaEn.toISOString(),
      editadaEn: f.editadaEn.toISOString(),
      fotos: o.fotos ? urlsDe(contenido, f.fotos.map((x) => x.url)).filter((u) => archivoPorClave.has(claveDeUrl(u) ?? "")) : [],
    };
  });

  const hoy = hoyEnFamilia();
  const nombradas = nombrarEntradas(entradas, extension);
  const conFotos = nombradas.some((n) => n.fotos.length > 0);
  const conAutor = tipo === "familiar";
  const datos: DatosExport = { tipo, exportadaEn: new Date().toISOString(), catalogo, entradas };

  // Contenido de texto: uno o varios archivos
  const textos: Record<string, string> = {};
  let unico: { texto: string; mime: string };
  if (o.formato === "json") {
    unico = { texto: JSON.stringify(documentoJson(datos, nombradas, o.fotos), null, 2), mime: "application/json; charset=utf-8" };
    textos["diario.json"] = unico.texto;
  } else if (o.formato === "csv") {
    unico = { texto: csvDeEntradas(nombradas, catalogo), mime: "text/csv; charset=utf-8" };
    textos["diario.csv"] = unico.texto;
  } else if (o.unir) {
    unico = { texto: markdownUnido(nombradas, escala, conAutor), mime: "text/markdown; charset=utf-8" };
    textos["diario.md"] = unico.texto;
  } else {
    unico = { texto: "", mime: "text/markdown; charset=utf-8" };
    for (const n of nombradas) textos[`${n.nombre}.md`] = notaMarkdown(n, escala, { conAutor });
  }

  const esZip = conFotos || (o.formato === "markdown" && !o.unir);
  if (!esZip) return { datos: unico.texto, nombre: nombreDeArchivo(o.formato, tipo, hoy, false), mime: unico.mime };

  const zip: Zippable = {};
  for (const [ruta, texto] of Object.entries(textos)) zip[ruta] = strToU8(texto);
  if (conFotos) {
    const rutaPorClave = new Map<string, string[]>();
    for (const n of nombradas) n.entrada.fotos.forEach((u, i) => {
      const c = claveDeUrl(u)!;
      rutaPorClave.set(c, [...(rutaPorClave.get(c) ?? []), n.fotos[i]]);
    });
    const lista = [...rutaPorClave.keys()];
    for (let i = 0; i < lista.length; i += 20) {
      const lote = await prisma.archivo.findMany({ where: { clave: { in: lista.slice(i, i + 20) } }, select: { clave: true, datos: true } });
      for (const a of lote) for (const ruta of rutaPorClave.get(a.clave) ?? []) zip[ruta] = [new Uint8Array(a.datos), { level: 0 }];
    }
  }
  return { datos: zipSync(zip), nombre: nombreDeArchivo(o.formato, tipo, hoy, true), mime: "application/zip" };
}
