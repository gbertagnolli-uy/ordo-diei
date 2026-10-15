// Propio de Ordo (lane 166, M1): material de estudio — lo que el padre deja para un día, una lección o un alumno en una fecha.
// Escribir: solo Padre/Madre. Un Hijo/Hija lee únicamente lo que cuelga de un plan suyo o de su propio nombre.
// `hoy` entra como parámetro ('YYYY-MM-DD'). Los archivos viven fuera (Drive/YouTube): acá se guardan enlaces y, para texto
// y markdown, el contenido.
import prisma from "../../prisma.ts";
import type { MaterialEstudio, Prisma } from "@prisma/client";
import { NoAutorizadoError, NoEncontradoError, aClave } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { DatoInvalidoError } from "./planes.ts";
import { detectarMaterial, esImprimible, impresionesRestantes, TIPOS_MATERIAL, vistaMaterial, type MaterialDetectado, type TipoMaterial, type VistaMaterial } from "../material.ts";
import { obtenerTitulo } from "./titulos.ts";

export type Actor = { id: number; rol: string };

export type MaterialVista = {
  id: number;
  titulo: string;
  tipo: TipoMaterial;
  proveedor: string | null;
  externoId: string | null;
  url: string | null;
  contenido: string | null;
  miniaturaUrl: string | null;
  orden: number;
  limiteImpresiones: number;
  imprimible: boolean;
  vista: VistaMaterial;
  hecho: boolean;
  /** Impresiones que le quedan al alumno que lo mira (null: lo mira un padre o no se sabe) */
  restantes: number | null;
  leccionId: number | null;
  diaLectivoId: number | null;
  alumnoId: number | null;
  fecha: string | null;
};

export type Destino = { leccionId: number } | { diaLectivoId: number } | { alumnoId: number; fecha: string };

const MAX_CONTENIDO = 50_000;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const exigirPadre = (a: Actor) => {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
};

const comoFecha = (clave: string) => new Date(`${clave}T00:00:00.000Z`);

export type UsoImpresion = { usadas: number; extras: number };

export function aVista(m: MaterialEstudio, uso?: UsoImpresion): MaterialVista {
  const base = { tipo: m.tipo as TipoMaterial, proveedor: (m.proveedor ?? null) as never, externoId: m.externoId, url: m.url };
  return {
    id: m.id,
    titulo: m.titulo,
    tipo: base.tipo,
    proveedor: m.proveedor,
    externoId: m.externoId,
    url: m.url,
    contenido: m.contenido,
    miniaturaUrl: m.miniaturaUrl,
    orden: m.orden,
    limiteImpresiones: m.limiteImpresiones,
    imprimible: m.limiteImpresiones > 0 && esImprimible(base),
    vista: vistaMaterial(base),
    hecho: m.hechoEn !== null,
    restantes: uso ? impresionesRestantes(m.limiteImpresiones, uso.usadas, uso.extras) : null,
    leccionId: m.leccionId,
    diaLectivoId: m.diaLectivoId,
    alumnoId: m.alumnoId,
    fecha: m.fecha ? aClave(m.fecha) : null,
  };
}

/** Impresiones usadas y extras de un alumno, por material (una sola consulta) */
export async function usoDeImpresiones(alumnoId: number, materialIds: number[]): Promise<Map<number, UsoImpresion>> {
  const mapa = new Map<number, UsoImpresion>();
  if (materialIds.length === 0) return mapa;
  const filas = await prisma.impresionMaterial.groupBy({ by: ["materialId", "tipo"], where: { alumnoId, materialId: { in: materialIds } }, _count: { _all: true } });
  for (const f of filas) {
    const u = mapa.get(f.materialId) ?? { usadas: 0, extras: 0 };
    if (f.tipo === "extra") u.extras += f._count._all;
    else u.usadas += f._count._all;
    mapa.set(f.materialId, u);
  }
  return mapa;
}

/** Vistas de un alumno: con lo que le queda de impresión a cada una */
export async function aVistasDeAlumno(filas: MaterialEstudio[], alumnoId: number): Promise<MaterialVista[]> {
  const uso = await usoDeImpresiones(alumnoId, filas.map((f) => f.id));
  return filas.map((f) => aVista(f, uso.get(f.id) ?? { usadas: 0, extras: 0 }));
}

// ---------- Permisos de lectura ----------

/** ¿Este alumno puede ver el material de este destino? (el padre siempre) */
async function puedeVerDestino(a: Actor, d: Destino): Promise<boolean> {
  if (esPadre(a.rol)) return true;
  if ("diaLectivoId" in d) return !!(await prisma.diaLectivo.findFirst({ where: { id: d.diaLectivoId, plan: { alumnoId: a.id } }, select: { id: true } }));
  if ("leccionId" in d) return !!(await prisma.leccionCurso.findFirst({ where: { id: d.leccionId, recurso: { planes: { some: { alumnoId: a.id } } } }, select: { id: true } }));
  return d.alumnoId === a.id;
}

async function exigirDestinoValido(d: Destino) {
  if ("diaLectivoId" in d) {
    if (!(await prisma.diaLectivo.findUnique({ where: { id: d.diaLectivoId }, select: { id: true } }))) throw new NoEncontradoError("Día no encontrado");
  } else if ("leccionId" in d) {
    if (!(await prisma.leccionCurso.findUnique({ where: { id: d.leccionId }, select: { id: true } }))) throw new NoEncontradoError("Lección no encontrada");
  } else {
    if (!FECHA.test(d.fecha)) throw new DatoInvalidoError("Fecha no válida");
    const alumno = await prisma.usuario.findUnique({ where: { id: d.alumnoId }, select: { rolFamiliar: true } });
    if (!alumno || (alumno.rolFamiliar !== "Hijo" && alumno.rolFamiliar !== "Hija")) throw new DatoInvalidoError("El material suelto es para un hijo o una hija");
  }
}

const dondeDestino = (d: Destino): Prisma.MaterialEstudioWhereInput =>
  "diaLectivoId" in d ? { diaLectivoId: d.diaLectivoId } : "leccionId" in d ? { leccionId: d.leccionId } : { alumnoId: d.alumnoId, fecha: comoFecha(d.fecha) };

// ---------- Lectura ----------

export async function listarMateriales(a: Actor, d: Destino): Promise<MaterialVista[]> {
  if (!(await puedeVerDestino(a, d))) throw new NoAutorizadoError("No tenés acceso a este material");
  const filas = await prisma.materialEstudio.findMany({ where: dondeDestino(d), orderBy: [{ orden: "asc" }, { id: "asc" }] });
  return esPadre(a.rol) ? filas.map((f) => aVista(f)) : aVistasDeAlumno(filas, a.id);
}

export async function obtenerMaterial(a: Actor, id: number): Promise<MaterialVista> {
  const m = await prisma.materialEstudio.findUnique({ where: { id } });
  if (!m) throw new NoEncontradoError("Material no encontrado");
  const destino: Destino = m.diaLectivoId ? { diaLectivoId: m.diaLectivoId } : m.leccionId ? { leccionId: m.leccionId } : { alumnoId: m.alumnoId ?? 0, fecha: m.fecha ? aClave(m.fecha) : "" };
  if (!(await puedeVerDestino(a, destino))) throw new NoAutorizadoError("No tenés acceso a este material");
  return esPadre(a.rol) ? aVista(m) : (await aVistasDeAlumno([m], a.id))[0];
}

/** Cantidad de materiales por día / lección (para las insignias del calendario y de las lecciones) */
export async function contarMateriales(a: Actor, filtro: { diaIds?: number[]; leccionIds?: number[] }) {
  exigirPadre(a);
  const [dias, lecciones] = await Promise.all([
    filtro.diaIds?.length ? prisma.materialEstudio.groupBy({ by: ["diaLectivoId"], where: { diaLectivoId: { in: filtro.diaIds } }, _count: { _all: true } }) : [],
    filtro.leccionIds?.length ? prisma.materialEstudio.groupBy({ by: ["leccionId"], where: { leccionId: { in: filtro.leccionIds } }, _count: { _all: true } }) : [],
  ]);
  return {
    dias: Object.fromEntries(dias.map((r) => [r.diaLectivoId, r._count._all])) as Record<number, number>,
    lecciones: Object.fromEntries(lecciones.map((r) => [r.leccionId, r._count._all])) as Record<number, number>,
  };
}

// ---------- Escritura (solo padres) ----------

export type DatosMaterial = {
  destino: Destino;
  /** Lo que pegó el padre: un enlace o el texto/markdown */
  entrada: string;
  titulo?: string | null;
  /** El padre corrige el tipo detectado (p. ej. un archivo de Drive que es un PDF) */
  tipo?: TipoMaterial | null;
  limiteImpresiones?: number | null;
};

/** Resuelve lo pegado: detecta el tipo y mejora el título con la página (sin bloquear si falla) */
export async function resolverEntrada(entrada: string, buscarTitulo = true): Promise<MaterialDetectado> {
  const det = detectarMaterial(entrada);
  if (buscarTitulo && det.url) {
    const t = await obtenerTitulo(det);
    if (t) det.titulo = t;
  }
  return det;
}

export async function crearMaterial(a: Actor, datos: DatosMaterial): Promise<MaterialVista> {
  exigirPadre(a);
  if (!datos.entrada?.trim()) throw new DatoInvalidoError("Pegá un enlace o escribí el texto");
  if (datos.tipo && !TIPOS_MATERIAL.includes(datos.tipo)) throw new DatoInvalidoError("Tipo de material no válido");
  const limite = datos.limiteImpresiones ?? 2;
  if (!Number.isInteger(limite) || limite < 0 || limite > 10) throw new DatoInvalidoError("El límite de impresiones va de 0 a 10");
  await exigirDestinoValido(datos.destino);

  const det = await resolverEntrada(datos.entrada, !datos.titulo?.trim());
  if (det.contenido !== null && det.contenido.length > MAX_CONTENIDO) throw new DatoInvalidoError("El texto es demasiado largo (máximo 50.000 caracteres)");
  const titulo = (datos.titulo?.trim() || det.titulo || "Material").slice(0, 150);
  const tipo = datos.tipo ?? det.tipo;

  const ultimo = await prisma.materialEstudio.aggregate({ where: dondeDestino(datos.destino), _max: { orden: true } });
  const d = datos.destino;
  const creado = await prisma.materialEstudio.create({
    data: {
      titulo,
      tipo,
      proveedor: det.proveedor,
      externoId: det.externoId,
      url: det.url,
      contenido: det.contenido,
      miniaturaUrl: det.miniaturaUrl,
      orden: (ultimo._max.orden ?? -1) + 1,
      limiteImpresiones: limite,
      creadorId: a.id,
      ...("diaLectivoId" in d ? { diaLectivoId: d.diaLectivoId } : "leccionId" in d ? { leccionId: d.leccionId } : { alumnoId: d.alumnoId, fecha: comoFecha(d.fecha) }),
    },
  });
  return aVista(creado);
}

export type CambiosMaterial = { titulo?: string; tipo?: TipoMaterial; limiteImpresiones?: number; contenido?: string | null; orden?: number };

export async function actualizarMaterial(a: Actor, id: number, c: CambiosMaterial): Promise<MaterialVista> {
  exigirPadre(a);
  // Validar antes de consultar: un dato malo no necesita ir a la base
  const data: Prisma.MaterialEstudioUpdateInput = {};
  if (c.titulo !== undefined) {
    if (!c.titulo.trim()) throw new DatoInvalidoError("Falta el título");
    data.titulo = c.titulo.trim().slice(0, 150);
  }
  if (c.tipo !== undefined) {
    if (!TIPOS_MATERIAL.includes(c.tipo)) throw new DatoInvalidoError("Tipo de material no válido");
    data.tipo = c.tipo;
  }
  if (c.limiteImpresiones !== undefined) {
    if (!Number.isInteger(c.limiteImpresiones) || c.limiteImpresiones < 0 || c.limiteImpresiones > 10) throw new DatoInvalidoError("El límite de impresiones va de 0 a 10");
    data.limiteImpresiones = c.limiteImpresiones;
  }
  if (c.contenido !== undefined && (c.contenido ?? "").length > MAX_CONTENIDO) throw new DatoInvalidoError("El texto es demasiado largo (máximo 50.000 caracteres)");
  if (c.orden !== undefined) data.orden = c.orden;

  const actual = await prisma.materialEstudio.findUnique({ where: { id } });
  if (!actual) throw new NoEncontradoError("Material no encontrado");
  if (c.contenido !== undefined) {
    if (actual.contenido === null) throw new DatoInvalidoError("Este material es un enlace: no tiene texto para editar");
    data.contenido = c.contenido ?? "";
  }
  return aVista(await prisma.materialEstudio.update({ where: { id }, data }));
}

export async function borrarMaterial(a: Actor, id: number) {
  exigirPadre(a);
  const { count } = await prisma.materialEstudio.deleteMany({ where: { id } });
  if (count === 0) throw new NoEncontradoError("Material no encontrado");
}

/** El alumno marca como hecho su material suelto (el de un curso se completa con su lección/día) */
export async function marcarMaterialHecho(a: Actor, id: number, hecho: boolean): Promise<MaterialVista> {
  const m = await prisma.materialEstudio.findUnique({ where: { id } });
  if (!m) throw new NoEncontradoError("Material no encontrado");
  if (m.alumnoId === null) throw new DatoInvalidoError("Este material se completa con su lección o su día");
  if (!esPadre(a.rol) && m.alumnoId !== a.id) throw new NoAutorizadoError("Este material no es tuyo");
  return aVista(await prisma.materialEstudio.update({ where: { id }, data: { hechoEn: hecho ? new Date() : null } }));
}

/** Material suelto de un alumno en una fecha, para «Hoy» */
export async function materialSueltoDeHoy(alumnoId: number, hoy: string): Promise<MaterialVista[]> {
  const filas = await prisma.materialEstudio.findMany({ where: { alumnoId, fecha: comoFecha(hoy) }, orderBy: [{ orden: "asc" }, { id: "asc" }] });
  return aVistasDeAlumno(filas, alumnoId);
}
