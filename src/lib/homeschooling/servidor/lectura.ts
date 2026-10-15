// Propio de Ordo (lane 175, L1): la lista de lectura de cada hijo. Un padre ve y edita la de todos; un hijo, la suya (puede
// anotar lo que lee y su avance). Los libros son de papel: acá solo se lleva la cuenta, la valoración y la narración.
import prisma from "../../prisma.ts";
import type { LecturaLibro, Prisma } from "@prisma/client";
import { aClave, aFecha, hoyEnFamilia, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { ESTADOS_LECTURA, paginasNuevas, porcentajeLeido, resumirLectura, type EstadoLectura, type ResumenLectura } from "../lectura.ts";
import { DatoInvalidoError } from "./planes.ts";

export type Actor = { id: number; rol: string };
export type LibroVista = {
  id: number;
  alumnoId: number;
  titulo: string;
  autor: string | null;
  portadaUrl: string | null;
  estado: EstadoLectura;
  paginasTotal: number | null;
  paginaActual: number;
  porcentaje: number | null;
  empezadoEn: string | null;
  terminadoEn: string | null;
  estrellas: number | null;
  narracion: string | null;
  asignado: boolean;
};
export type ListaLectura = { alumno: { id: number; nombre: string }; libros: LibroVista[]; resumen: ResumenLectura };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const aVista = (l: LecturaLibro): LibroVista => ({
  id: l.id,
  alumnoId: l.alumnoId,
  titulo: l.titulo,
  autor: l.autor,
  portadaUrl: l.portadaUrl,
  estado: l.estado,
  paginasTotal: l.paginasTotal,
  paginaActual: l.paginaActual,
  porcentaje: porcentajeLeido(l.paginaActual, l.paginasTotal),
  empezadoEn: l.empezadoEn ? aClave(l.empezadoEn) : null,
  terminadoEn: l.terminadoEn ? aClave(l.terminadoEn) : null,
  estrellas: l.estrellas,
  narracion: l.narracion,
  asignado: l.asignadoPorId !== null,
});

/** El libro, si el actor puede tocarlo (un padre, o el dueño) */
async function libroPropio(a: Actor, id: number): Promise<LecturaLibro> {
  const l = await prisma.lecturaLibro.findUnique({ where: { id } });
  if (!l) throw new NoEncontradoError("Libro no encontrado");
  if (!esPadre(a.rol) && l.alumnoId !== a.id) throw new NoAutorizadoError("Este libro no es tuyo");
  return l;
}

function exigirAlumno(a: Actor, alumnoId: number) {
  if (!esPadre(a.rol) && alumnoId !== a.id) throw new NoAutorizadoError("Solo podés ver tu propia lista de lectura");
}

export async function listaDeLectura(a: Actor, alumnoId: number, hoy = hoyEnFamilia()): Promise<ListaLectura> {
  exigirAlumno(a, alumnoId);
  const alumno = await prisma.usuario.findUnique({ where: { id: alumnoId }, select: { id: true, nombre: true, rolFamiliar: true } });
  if (!alumno || (alumno.rolFamiliar !== "Hijo" && alumno.rolFamiliar !== "Hija")) throw new NoEncontradoError("Alumno no encontrado");
  const anio = hoy.slice(0, 4);
  const [libros, sesiones] = await Promise.all([
    prisma.lecturaLibro.findMany({ where: { alumnoId }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] }),
    prisma.sesionLectura.findMany({ where: { alumnoId, fecha: { gte: aFecha(`${Number(anio) - 1}-12-31`) } }, select: { fecha: true, paginas: true, minutos: true } }),
  ]);
  const terminados = libros.filter((l) => l.estado === "leido" && l.terminadoEn && aClave(l.terminadoEn).startsWith(anio)).length;
  return {
    alumno: { id: alumno.id, nombre: alumno.nombre },
    libros: libros.map(aVista),
    resumen: resumirLectura(sesiones.map((s) => ({ fecha: aClave(s.fecha), paginas: s.paginas, minutos: s.minutos })), hoy, terminados),
  };
}

export type DatosLibro = { alumnoId: number; titulo: string; autor?: string | null; paginasTotal?: number | null; portadaUrl?: string | null; estado?: EstadoLectura };

export async function agregarLibro(a: Actor, d: DatosLibro, hoy = hoyEnFamilia()): Promise<LibroVista> {
  exigirAlumno(a, d.alumnoId);
  const titulo = d.titulo.trim();
  if (!titulo) throw new DatoInvalidoError("Falta el título del libro");
  if (d.paginasTotal != null && (!Number.isInteger(d.paginasTotal) || d.paginasTotal < 1 || d.paginasTotal > 5000)) throw new DatoInvalidoError("Las páginas van de 1 a 5000");
  if (d.estado && !ESTADOS_LECTURA.includes(d.estado)) throw new DatoInvalidoError("Estado no válido");
  const alumno = await prisma.usuario.findUnique({ where: { id: d.alumnoId }, select: { rolFamiliar: true } });
  if (!alumno || (alumno.rolFamiliar !== "Hijo" && alumno.rolFamiliar !== "Hija")) throw new DatoInvalidoError("La lectura es para un hijo o una hija");
  const estado = d.estado ?? "por_leer";
  const l = await prisma.lecturaLibro.create({
    data: {
      alumnoId: d.alumnoId,
      titulo: titulo.slice(0, 150),
      autor: d.autor?.trim().slice(0, 100) || null,
      paginasTotal: d.paginasTotal ?? null,
      portadaUrl: d.portadaUrl?.trim() || null,
      estado,
      empezadoEn: estado === "leyendo" ? aFecha(hoy) : null,
      asignadoPorId: esPadre(a.rol) && a.id !== d.alumnoId ? a.id : null,
    },
  });
  return aVista(l);
}

/** «Hoy leí hasta la página N» (y cuántos minutos): suma una sesión, actualiza el avance y pasa el libro a «leyendo» */
export async function registrarLectura(a: Actor, id: number, d: { hastaPagina: number; minutos?: number | null; fecha?: string }, hoy = hoyEnFamilia()): Promise<LibroVista> {
  const libro = await libroPropio(a, id);
  const fecha = d.fecha ?? hoy;
  if (!FECHA.test(fecha) || fecha > hoy) throw new DatoInvalidoError("La fecha no puede ser futura");
  if (d.minutos != null && (!Number.isInteger(d.minutos) || d.minutos < 0 || d.minutos > 600)) throw new DatoInvalidoError("Los minutos van de 0 a 600");
  const nuevo = paginasNuevas(libro.paginaActual, d.hastaPagina, libro.paginasTotal);
  if (!nuevo) throw new DatoInvalidoError("Indicá hasta qué página llegaste");
  if (nuevo.leidas === 0 && nuevo.pagina === libro.paginaActual) throw new DatoInvalidoError("Esa es la página donde ya estabas");
  const terminaSolo = libro.paginasTotal !== null && nuevo.pagina >= libro.paginasTotal;
  return prisma.$transaction(async (tx) => {
    if (nuevo.leidas > 0) await tx.sesionLectura.create({ data: { libroId: id, alumnoId: libro.alumnoId, fecha: aFecha(fecha), paginas: nuevo.leidas, minutos: d.minutos ?? null } });
    const actualizado = await tx.lecturaLibro.update({
      where: { id },
      data: {
        paginaActual: nuevo.pagina,
        estado: terminaSolo ? "leido" : "leyendo",
        empezadoEn: libro.empezadoEn ?? aFecha(fecha),
        ...(terminaSolo && !libro.terminadoEn ? { terminadoEn: aFecha(fecha) } : {}),
      },
    });
    return aVista(actualizado);
  });
}

export type CierreLibro = { estrellas?: number | null; narracion?: string | null; fecha?: string };

/** Lo termina: valoración de 1 a 5 y la narración (lo que contó con sus palabras) */
export async function terminarLibro(a: Actor, id: number, d: CierreLibro, hoy = hoyEnFamilia()): Promise<LibroVista> {
  const libro = await libroPropio(a, id);
  const fecha = d.fecha ?? hoy;
  if (!FECHA.test(fecha) || fecha > hoy) throw new DatoInvalidoError("La fecha no puede ser futura");
  if (d.estrellas != null && (!Number.isInteger(d.estrellas) || d.estrellas < 1 || d.estrellas > 5)) throw new DatoInvalidoError("La valoración va de 1 a 5");
  if ((d.narracion ?? "").length > 3000) throw new DatoInvalidoError("La narración es demasiado larga (máximo 3000 caracteres)");
  return aVista(
    await prisma.lecturaLibro.update({
      where: { id },
      data: {
        estado: "leido",
        terminadoEn: aFecha(fecha),
        empezadoEn: libro.empezadoEn ?? aFecha(fecha),
        paginaActual: libro.paginasTotal ?? libro.paginaActual,
        estrellas: d.estrellas ?? libro.estrellas,
        narracion: d.narracion === undefined ? libro.narracion : d.narracion?.trim() || null,
      },
    })
  );
}

export type CambiosLibro = { titulo?: string; autor?: string | null; paginasTotal?: number | null; portadaUrl?: string | null; estado?: EstadoLectura; narracion?: string | null; estrellas?: number | null };

export async function editarLibro(a: Actor, id: number, c: CambiosLibro, hoy = hoyEnFamilia()): Promise<LibroVista> {
  const libro = await libroPropio(a, id);
  const data: Prisma.LecturaLibroUpdateInput = {};
  if (c.titulo !== undefined) {
    if (!c.titulo.trim()) throw new DatoInvalidoError("Falta el título del libro");
    data.titulo = c.titulo.trim().slice(0, 150);
  }
  if (c.autor !== undefined) data.autor = c.autor?.trim().slice(0, 100) || null;
  if (c.portadaUrl !== undefined) data.portadaUrl = c.portadaUrl?.trim() || null;
  if (c.paginasTotal !== undefined) {
    if (c.paginasTotal !== null && (!Number.isInteger(c.paginasTotal) || c.paginasTotal < 1 || c.paginasTotal > 5000)) throw new DatoInvalidoError("Las páginas van de 1 a 5000");
    data.paginasTotal = c.paginasTotal;
  }
  if (c.estrellas !== undefined) {
    if (c.estrellas !== null && (!Number.isInteger(c.estrellas) || c.estrellas < 1 || c.estrellas > 5)) throw new DatoInvalidoError("La valoración va de 1 a 5");
    data.estrellas = c.estrellas;
  }
  if (c.narracion !== undefined) {
    if ((c.narracion ?? "").length > 3000) throw new DatoInvalidoError("La narración es demasiado larga (máximo 3000 caracteres)");
    data.narracion = c.narracion?.trim() || null;
  }
  if (c.estado !== undefined && c.estado !== libro.estado) {
    if (!ESTADOS_LECTURA.includes(c.estado)) throw new DatoInvalidoError("Estado no válido");
    data.estado = c.estado;
    if (c.estado === "leyendo") {
      data.empezadoEn = libro.empezadoEn ?? aFecha(hoy);
      data.terminadoEn = null;
    } else if (c.estado === "leido") {
      data.empezadoEn = libro.empezadoEn ?? aFecha(hoy);
      data.terminadoEn = libro.terminadoEn ?? aFecha(hoy);
    } else {
      data.empezadoEn = null;
      data.terminadoEn = null;
      data.paginaActual = 0;
    }
  }
  return aVista(await prisma.lecturaLibro.update({ where: { id }, data }));
}

export async function borrarLibro(a: Actor, id: number): Promise<void> {
  await libroPropio(a, id);
  await prisma.lecturaLibro.delete({ where: { id } });
}
