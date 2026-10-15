// Evidencias de aprendizaje con foto (el «showcase» de Roost sin votos ni reseñas). El Hijo crea y ve solo las suyas;
// solo Padre/Madre revisan. Aprobar o destacar NO toca ningún saldo (no se porta el trigger de puntos de Roost):
// las estrellas del padre son una valoración, no monedas.
import prisma from "../../prisma.ts";
import type { Prisma } from "@prisma/client";
import { NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { claveDeUrl } from "../../archivos.ts";
import { mapShowcase } from "../roost/dto.ts";
import type { ShowcaseStats, ShowcaseWithDetails } from "../roost/tipos.ts";
import { ConflictoError, DatoInvalidoError } from "./planes.ts";

export type Actor = { id: number; rol: string };
type Db = Prisma.TransactionClient | typeof prisma;

const INCLUIR = {
  imagenes: true,
  alumno: { select: { nombre: true } },
  diaLectivo: { select: { plan: { select: { recurso: { select: { materia: { select: { nombre: true } } } } } } } },
} as const;

const exigirPadre = (a: Actor) => {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
};

/** Borra el `Archivo` de una URL si ninguna imagen de evidencia la sigue usando */
export async function limpiarArchivo(db: Db, url: string): Promise<boolean> {
  const clave = claveDeUrl(url);
  if (!clave) return false;
  if ((await db.evidenciaImagen.count({ where: { archivoUrl: url } })) > 0) return false;
  const r = await db.archivo.deleteMany({ where: { clave } });
  return r.count > 0;
}

/** La URL tiene que ser un archivo guardado (/api/archivos/<uuid>) que exista */
export async function validarUrlImagen(db: Db, url: string): Promise<string> {
  const limpia = url.trim();
  const clave = claveDeUrl(limpia);
  if (!clave) throw new DatoInvalidoError("La imagen no es válida");
  if (!(await db.archivo.findUnique({ where: { clave }, select: { id: true } }))) throw new DatoInvalidoError("La imagen no existe");
  return limpia;
}

async function cargar(db: Db, a: Actor, id: number) {
  const e = await db.evidenciaAprendizaje.findUnique({ where: { id }, include: INCLUIR });
  if (!e) throw new NoEncontradoError("Evidencia no encontrada");
  if (!esPadre(a.rol) && e.alumnoId !== a.id) throw new NoAutorizadoError("Esa evidencia no es tuya");
  return e;
}

export type DatosEvidencia = { alumnoId?: number; titulo?: string | null; nota?: string | null; diaLectivoId?: number | null; imagenes: string[] };

export async function crearEvidencia(a: Actor, d: DatosEvidencia): Promise<ShowcaseWithDetails> {
  const alumnoId = esPadre(a.rol) ? (d.alumnoId ?? a.id) : a.id;
  if (d.imagenes.length === 0) throw new DatoInvalidoError("Falta la foto");
  if (d.imagenes.length > 6) throw new DatoInvalidoError("Máximo 6 fotos por evidencia");
  return prisma.$transaction(async (tx) => {
    const urls = [];
    for (const u of d.imagenes) urls.push(await validarUrlImagen(tx, u));
    if (d.diaLectivoId) {
      const dia = await tx.diaLectivo.findUnique({ where: { id: d.diaLectivoId }, select: { plan: { select: { alumnoId: true } } } });
      if (!dia || dia.plan.alumnoId !== alumnoId) throw new DatoInvalidoError("Ese día no es del alumno");
    }
    const e = await tx.evidenciaAprendizaje.create({
      data: {
        alumnoId,
        diaLectivoId: d.diaLectivoId ?? null,
        titulo: d.titulo?.trim() || null,
        nota: d.nota?.trim() || null,
        imagenes: { create: urls.map((archivoUrl, orden) => ({ archivoUrl, orden })) },
      },
      include: INCLUIR,
    });
    return mapShowcase(e);
  });
}

export type FiltroEvidencias = { estado?: "pendiente" | "aprobada" | "ajustar"; alumnoId?: number | null; materiaId?: number | null; mes?: string | null; destacada?: boolean };

export async function listarEvidencias(a: Actor, f: FiltroEvidencias = {}): Promise<ShowcaseWithDetails[]> {
  const where: Prisma.EvidenciaAprendizajeWhereInput = { alumnoId: esPadre(a.rol) ? (f.alumnoId ?? undefined) : a.id };
  if (f.estado) where.estado = f.estado;
  if (f.destacada) where.destacada = true;
  if (f.materiaId) where.diaLectivo = { plan: { recurso: { materiaId: f.materiaId } } };
  if (f.mes && /^\d{4}-\d{2}$/.test(f.mes)) {
    const [y, m] = f.mes.split("-").map(Number);
    where.createdAt = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
  }
  const filas = await prisma.evidenciaAprendizaje.findMany({ where, include: INCLUIR, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 300 });
  return filas.map(mapShowcase);
}

export async function obtenerEvidencia(a: Actor, id: number) {
  return mapShowcase(await cargar(prisma, a, id));
}

export async function estadisticasEvidencias(a: Actor): Promise<ShowcaseStats> {
  exigirPadre(a);
  const hoy = new Date();
  const inicioMes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  const [total, pendiente, aprobada, ajustar, destacada, esteMes] = await Promise.all([
    prisma.evidenciaAprendizaje.count(),
    prisma.evidenciaAprendizaje.count({ where: { estado: "pendiente" } }),
    prisma.evidenciaAprendizaje.count({ where: { estado: "aprobada" } }),
    prisma.evidenciaAprendizaje.count({ where: { estado: "ajustar" } }),
    prisma.evidenciaAprendizaje.count({ where: { destacada: true } }),
    prisma.evidenciaAprendizaje.count({ where: { createdAt: { gte: inicioMes } } }),
  ]);
  return { total, pending: pendiente, approved: aprobada, rejected: ajustar, featured: destacada, thisMonth: esteMes };
}

export type AccionEvidencia =
  | { accion: "aprobar"; estrellas?: number | null }
  | { accion: "ajustar"; comentario: string }
  | { accion: "destacar" }
  | { accion: "quitar_destacada" }
  | { accion: "reenviar"; titulo?: string | null; nota?: string | null };

export async function actuarSobreEvidencia(a: Actor, id: number, accion: AccionEvidencia): Promise<ShowcaseWithDetails> {
  const actual = await cargar(prisma, a, id);
  const ahora = new Date();

  if (accion.accion === "reenviar") {
    if (actual.alumnoId !== a.id && !esPadre(a.rol)) throw new NoAutorizadoError("Esa evidencia no es tuya");
    if (actual.estado !== "ajustar") throw new ConflictoError("Solo se puede reenviar una evidencia con ajustes pedidos");
    const e = await prisma.evidenciaAprendizaje.update({
      where: { id },
      data: {
        estado: "pendiente",
        ...(accion.titulo !== undefined && { titulo: accion.titulo?.trim() || null }),
        ...(accion.nota !== undefined && { nota: accion.nota?.trim() || null }),
      },
      include: INCLUIR,
    });
    return mapShowcase(e);
  }

  exigirPadre(a);
  let data: Prisma.EvidenciaAprendizajeUpdateInput;
  switch (accion.accion) {
    case "aprobar": {
      const estrellas = accion.estrellas ?? null;
      if (estrellas !== null && !(Number.isInteger(estrellas) && estrellas >= 1 && estrellas <= 5)) throw new DatoInvalidoError("Las estrellas van de 1 a 5");
      data = { estado: "aprobada", estrellas, comentarioPadre: null, revisadaPor: { connect: { id: a.id } }, revisadaEn: ahora };
      break;
    }
    case "ajustar": {
      const comentario = accion.comentario.trim();
      if (!comentario) throw new DatoInvalidoError("Escribí qué hay que ajustar");
      data = { estado: "ajustar", comentarioPadre: comentario, destacada: false, destacadaEn: null, revisadaPor: { connect: { id: a.id } }, revisadaEn: ahora };
      break;
    }
    case "destacar":
      if (actual.estado !== "aprobada") throw new ConflictoError("Solo se puede destacar una evidencia aprobada");
      data = { destacada: true, destacadaEn: ahora };
      break;
    case "quitar_destacada":
      data = { destacada: false, destacadaEn: null };
      break;
  }
  return mapShowcase(await prisma.evidenciaAprendizaje.update({ where: { id }, data, include: INCLUIR }));
}

/** Agregar una foto: el dueño o un padre, mientras no esté aprobada */
export async function agregarImagen(a: Actor, id: number, url: string, pie?: string | null) {
  return prisma.$transaction(async (tx) => {
    const e = await cargar(tx, a, id);
    if (e.estado === "aprobada") throw new ConflictoError("La evidencia ya está aprobada");
    if (e.imagenes.length >= 6) throw new DatoInvalidoError("Máximo 6 fotos por evidencia");
    const archivoUrl = await validarUrlImagen(tx, url);
    const orden = e.imagenes.reduce((m, i) => Math.max(m, i.orden), -1) + 1;
    await tx.evidenciaImagen.create({ data: { evidenciaId: id, archivoUrl, orden, pie: pie?.trim() || null } });
    return mapShowcase(await cargar(tx, a, id));
  });
}

export async function quitarImagen(a: Actor, id: number, imagenId: number) {
  return prisma.$transaction(async (tx) => {
    const e = await cargar(tx, a, id);
    if (e.estado === "aprobada" && !esPadre(a.rol)) throw new ConflictoError("La evidencia ya está aprobada");
    const img = e.imagenes.find((i) => i.id === imagenId);
    if (!img) throw new NoEncontradoError("Foto no encontrada");
    if (e.imagenes.length === 1) throw new ConflictoError("La evidencia necesita al menos una foto; borrala entera si no la querés");
    await tx.evidenciaImagen.delete({ where: { id: imagenId } });
    await limpiarArchivo(tx, img.archivoUrl);
    return mapShowcase(await cargar(tx, a, id));
  });
}

export async function borrarEvidencia(a: Actor, id: number) {
  await prisma.$transaction(async (tx) => {
    const e = await cargar(tx, a, id);
    if (e.estado === "aprobada" && !esPadre(a.rol)) throw new ConflictoError("La evidencia ya está aprobada");
    await tx.evidenciaAprendizaje.delete({ where: { id } });
    for (const i of e.imagenes) await limpiarArchivo(tx, i.archivoUrl);
  });
}

