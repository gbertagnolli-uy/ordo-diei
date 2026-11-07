// Biblioteca (lane 270), lado servidor. Biblioteca de la familia: todos ven todos los libros; solo los
// padres cargan, editan y borran (D2). El estado y la posición de lectura son de cada usuario.
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { NoAutorizadoError, NoEncontradoError } from "@/lib/habitos/server";
import {
  esEstado,
  ordenarPistas,
  porcentajeValido,
  siguienteEstado,
  validarLibro,
  type EstadoBiblioteca,
  type Formato,
} from "./reglas";

type Actor = { id: number; esPadre: boolean };

export type LibroResumen = {
  id: number;
  titulo: string;
  autor: string | null;
  portadaUrl: string | null;
  esAudiolibro: boolean;
  estanteIds: number[];
  estado: EstadoBiblioteca;
  porcentaje: number;
  actualizadoEn: string | null; // última vez que este usuario lo leyó o escuchó
};

export type ArchivoVista = { id: number; url: string; formato: Formato; orden: number; titulo: string | null; duracionSeg: number | null };

export type LibroDetalle = LibroResumen & {
  sinopsis: string | null;
  archivos: ArchivoVista[];
  posicion: { cfi: string | null; pagina: number | null; archivoId: number | null; posicionSeg: number | null };
};

export type EstanteVista = { id: number; nombre: string; orden: number };

const soloPadres = (actor: Actor) => {
  if (!actor.esPadre) throw new NoAutorizadoError("Solo los padres pueden cambiar la biblioteca");
};

const incluirResumen = (usuarioId: number) => ({
  estantes: { select: { estanteId: true } },
  estados: { where: { usuarioId } },
});

type LibroConEstado = Prisma.BibliotecaLibroGetPayload<{ include: ReturnType<typeof incluirResumen> }>;

function aResumen(l: LibroConEstado): LibroResumen {
  const e = l.estados[0];
  return {
    id: l.id,
    titulo: l.titulo,
    autor: l.autor,
    portadaUrl: l.portadaUrl,
    esAudiolibro: l.esAudiolibro,
    estanteIds: l.estantes.map((x) => x.estanteId),
    estado: e?.estado ?? "sin_empezar",
    porcentaje: e?.porcentaje ?? 0,
    actualizadoEn: e ? e.updatedAt.toISOString() : null,
  };
}

/** Todos los libros, con el estado de quien pregunta. */
export async function listarLibros(actor: Actor): Promise<LibroResumen[]> {
  const filas = await prisma.bibliotecaLibro.findMany({ orderBy: { titulo: "asc" }, include: incluirResumen(actor.id) });
  return filas.map(aResumen);
}

export async function detalleLibro(actor: Actor, id: number): Promise<LibroDetalle> {
  const l = await prisma.bibliotecaLibro.findUnique({ where: { id }, include: { ...incluirResumen(actor.id), archivos: true } });
  if (!l) throw new NoEncontradoError("El libro no existe");
  const e = l.estados[0];
  return {
    ...aResumen(l),
    sinopsis: l.sinopsis,
    archivos: ordenarPistas(l.archivos).map((a) => ({
      id: a.id,
      url: a.url,
      formato: a.formato as Formato,
      orden: a.orden,
      titulo: a.titulo,
      duracionSeg: a.duracionSeg,
    })),
    posicion: { cfi: e?.cfi ?? null, pagina: e?.pagina ?? null, archivoId: e?.archivoId ?? null, posicionSeg: e?.posicionSeg ?? null },
  };
}

async function estantesExistentes(ids: number[]) {
  if (ids.length === 0) return;
  const n = await prisma.bibliotecaEstante.count({ where: { id: { in: ids } } });
  if (n !== ids.length) throw new Error("Algún estante no existe");
}

export async function crearLibro(actor: Actor, body: Record<string, unknown>): Promise<LibroDetalle> {
  soloPadres(actor);
  const v = validarLibro(body, { conArchivos: true });
  await estantesExistentes(v.estanteIds);
  const l = await prisma.bibliotecaLibro.create({
    data: {
      titulo: v.titulo,
      autor: v.autor,
      sinopsis: v.sinopsis,
      portadaUrl: v.portadaUrl,
      esAudiolibro: v.esAudiolibro ?? false,
      cargadoPorId: actor.id,
      archivos: { create: v.archivos ?? [] },
      estantes: { create: v.estanteIds.map((estanteId) => ({ estanteId })) },
    },
  });
  return detalleLibro(actor, l.id);
}

/** Edita título, autor, sinopsis, portada y estantes. Los archivos no se cambian (se borra y se vuelve a cargar). */
export async function editarLibro(actor: Actor, id: number, body: Record<string, unknown>): Promise<LibroDetalle> {
  soloPadres(actor);
  const actual = await prisma.bibliotecaLibro.findUnique({ where: { id }, select: { id: true } });
  if (!actual) throw new NoEncontradoError("El libro no existe");
  const v = validarLibro(body, { conArchivos: false });
  await estantesExistentes(v.estanteIds);
  await prisma.$transaction([
    prisma.bibliotecaEstanteLibro.deleteMany({ where: { libroId: id } }),
    prisma.bibliotecaLibro.update({
      where: { id },
      data: {
        titulo: v.titulo,
        autor: v.autor,
        sinopsis: v.sinopsis,
        portadaUrl: v.portadaUrl,
        estantes: { create: v.estanteIds.map((estanteId) => ({ estanteId })) },
      },
    }),
  ]);
  return detalleLibro(actor, id);
}

export async function borrarLibro(actor: Actor, id: number): Promise<void> {
  soloPadres(actor);
  const r = await prisma.bibliotecaLibro.deleteMany({ where: { id } });
  if (r.count === 0) throw new NoEncontradoError("El libro no existe");
}

/**
 * Guarda dónde quedó quien lee o escucha. `porcentaje` es obligatorio; `cfi` (ePub), `pagina` (PDF) y
 * `archivoId` + `posicionSeg` (audiolibro) según el tipo. `estado` solo cuando el usuario lo elige a mano.
 */
export async function guardarPosicion(actor: Actor, libroId: number, body: Record<string, unknown>): Promise<{ estado: EstadoBiblioteca; porcentaje: number }> {
  const libro = await prisma.bibliotecaLibro.findUnique({ where: { id: libroId }, select: { archivos: { select: { id: true } } } });
  if (!libro) throw new NoEncontradoError("El libro no existe");
  const porcentaje = porcentajeValido(body.porcentaje);
  const manual = body.estado === undefined || body.estado === null ? null : body.estado;
  if (manual !== null && !esEstado(manual)) throw new Error("Estado inválido");
  const cfi = typeof body.cfi === "string" && body.cfi.length <= 2000 ? body.cfi : null;
  const pagina = Number.isInteger(body.pagina) && (body.pagina as number) > 0 ? (body.pagina as number) : null;
  const archivoId = Number.isInteger(body.archivoId) && libro.archivos.some((a) => a.id === body.archivoId) ? (body.archivoId as number) : null;
  const posicionSeg = typeof body.posicionSeg === "number" && Number.isFinite(body.posicionSeg) && body.posicionSeg >= 0 ? body.posicionSeg : null;

  const previo = await prisma.bibliotecaEstado.findUnique({ where: { usuarioId_libroId: { usuarioId: actor.id, libroId } } });
  const estado = siguienteEstado(previo?.estado ?? "sin_empezar", porcentaje, manual);
  const ahora = new Date();
  const datos = {
    estado,
    porcentaje: estado === "leido" && !manual ? Math.max(porcentaje, previo?.porcentaje ?? 0) : porcentaje,
    cfi: cfi ?? previo?.cfi ?? null,
    pagina: pagina ?? previo?.pagina ?? null,
    archivoId: archivoId ?? previo?.archivoId ?? null,
    posicionSeg: posicionSeg ?? previo?.posicionSeg ?? null,
    empezadoEn: previo?.empezadoEn ?? (estado !== "sin_empezar" ? ahora : null),
    terminadoEn: estado === "leido" ? (previo?.terminadoEn ?? ahora) : null,
  };
  const r = await prisma.bibliotecaEstado.upsert({
    where: { usuarioId_libroId: { usuarioId: actor.id, libroId } },
    create: { usuarioId: actor.id, libroId, ...datos },
    update: datos,
  });
  return { estado: r.estado, porcentaje: r.porcentaje };
}

export async function listarEstantes(): Promise<EstanteVista[]> {
  return prisma.bibliotecaEstante.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }], select: { id: true, nombre: true, orden: true } });
}

const nombreEstante = (v: unknown) => {
  if (typeof v !== "string" || !v.trim()) throw new Error("Falta el nombre del estante");
  const n = v.trim();
  if (n.length > 60) throw new Error("El nombre del estante es demasiado largo (máximo 60 caracteres)");
  return n;
};

const repetido = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function crearEstante(actor: Actor, body: Record<string, unknown>): Promise<EstanteVista> {
  soloPadres(actor);
  const nombre = nombreEstante(body.nombre);
  const orden = await prisma.bibliotecaEstante.count();
  try {
    return await prisma.bibliotecaEstante.create({ data: { nombre, orden }, select: { id: true, nombre: true, orden: true } });
  } catch (e) {
    if (repetido(e)) throw new Error("Ya hay un estante con ese nombre");
    throw e;
  }
}

export async function editarEstante(actor: Actor, body: Record<string, unknown>): Promise<EstanteVista> {
  soloPadres(actor);
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Estante inválido");
  const data: { nombre?: string; orden?: number } = {};
  if (body.nombre !== undefined) data.nombre = nombreEstante(body.nombre);
  if (body.orden !== undefined) {
    if (!Number.isInteger(body.orden) || (body.orden as number) < 0) throw new Error("Orden inválido");
    data.orden = body.orden as number;
  }
  try {
    return await prisma.bibliotecaEstante.update({ where: { id }, data, select: { id: true, nombre: true, orden: true } });
  } catch (e) {
    if (repetido(e)) throw new Error("Ya hay un estante con ese nombre");
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") throw new NoEncontradoError("El estante no existe");
    throw e;
  }
}

export async function borrarEstante(actor: Actor, id: number): Promise<void> {
  soloPadres(actor);
  const r = await prisma.bibliotecaEstante.deleteMany({ where: { id } });
  if (r.count === 0) throw new NoEncontradoError("El estante no existe");
}
