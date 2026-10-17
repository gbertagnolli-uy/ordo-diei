// Propio de Ordo (lane 168, P1): imprimir la tarea desde la app, con tope. Cada vez que el alumno abre la vista de impresión
// queda un «uso»; permitidas = límite del material (0–10, por defecto 2) + las «extra» que le da un padre. Superado el tope,
// el servidor se niega. Ojo (BLOQUEOS B-2): una web no sabe si salió papel; se cuenta el hecho de abrir la impresión, y una
// hoja de texto ya abierta vale 15 minutos para reenviarla si la impresora falla, sin gastar otra.
import { randomUUID } from "node:crypto";
import prisma from "../../prisma.ts";
import { NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { esImagenMaterial, impresionesRestantes, MINUTOS_HOJA_IMPRESA } from "../material.ts";
import { ConflictoError, DatoInvalidoError } from "./planes.ts";
import { obtenerMaterial, type Actor, type MaterialVista } from "./materiales.ts";

export type ResultadoImpresion = {
  /** Impresiones que le quedan tras esta (null si imprime un padre: sin tope) */
  restantes: number | null;
  /** Hoja propia (texto/markdown/imagen): ruta de la vista de impresión */
  hojaUrl: string | null;
  /** PDF/Docs: dirección que ya es un PDF imprimible, se abre en otra pestaña */
  externaUrl: string | null;
};

export async function registrarImpresion(a: Actor, materialId: number): Promise<ResultadoImpresion> {
  const m = await obtenerMaterial(a, materialId);
  if (!m.imprimible) throw new DatoInvalidoError(m.limiteImpresiones === 0 ? "Este material no se imprime desde la app" : "Este tipo de material no se puede imprimir desde la app");
  const usaHojaPropia = m.contenido !== null || esImagenMaterial(m);

  if (esPadre(a.rol)) {
    // Un padre imprime sin tope y sin gastar el de los hijos; la hoja de texto/imagen necesita su token igual
    const token = usaHojaPropia ? randomUUID() : null;
    if (token) await prisma.impresionMaterial.create({ data: { materialId, alumnoId: a.id, tipo: "padre", token } });
    return { restantes: null, hojaUrl: token ? `/dashboard/homeschooling/imprimir/${token}` : null, externaUrl: usaHojaPropia ? null : m.vista.imprimirUrl };
  }

  return prisma.$transaction(
    async (tx) => {
      const filas = await tx.impresionMaterial.groupBy({ by: ["tipo"], where: { materialId, alumnoId: a.id }, _count: { _all: true } });
      const usadas = filas.find((f) => f.tipo === "uso")?._count._all ?? 0;
      const extras = filas.find((f) => f.tipo === "extra")?._count._all ?? 0;
      if (impresionesRestantes(m.limiteImpresiones, usadas, extras) <= 0) throw new ConflictoError("Ya usaste todas las impresiones de este material. Pedile una más a mamá o a papá.");
      const token = usaHojaPropia ? randomUUID() : null;
      await tx.impresionMaterial.create({ data: { materialId, alumnoId: a.id, tipo: "uso", token } });
      return { restantes: impresionesRestantes(m.limiteImpresiones, usadas + 1, extras), hojaUrl: token ? `/dashboard/homeschooling/imprimir/${token}` : null, externaUrl: usaHojaPropia ? null : m.vista.imprimirUrl };
    },
    { isolationLevel: "Serializable" }
  );
}

export type ResumenImpresion = { alumnoId: number; nombre: string; usadas: number; permitidas: number; ultima: string | null };

/** Qué imprimió cada hijo de un material (solo padres) */
export async function resumenImpresiones(a: Actor, materialId: number): Promise<ResumenImpresion[]> {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
  const m = await prisma.materialEstudio.findUnique({ where: { id: materialId }, select: { limiteImpresiones: true } });
  if (!m) throw new NoEncontradoError("Material no encontrado");
  const filas = await prisma.impresionMaterial.findMany({ where: { materialId, tipo: { in: ["uso", "extra"] } }, select: { alumnoId: true, tipo: true, createdAt: true, alumno: { select: { nombre: true } } } });
  const por = new Map<number, ResumenImpresion>();
  for (const f of filas) {
    const r = por.get(f.alumnoId) ?? { alumnoId: f.alumnoId, nombre: f.alumno.nombre, usadas: 0, permitidas: m.limiteImpresiones, ultima: null };
    if (f.tipo === "extra") r.permitidas += 1;
    else {
      r.usadas += 1;
      const t = f.createdAt.toISOString();
      if (!r.ultima || t > r.ultima) r.ultima = t;
    }
    por.set(f.alumnoId, r);
  }
  return [...por.values()].sort((x, y) => x.nombre.localeCompare(y.nombre));
}

/** El padre le da una impresión más a un hijo */
export async function darImpresionExtra(a: Actor, materialId: number, alumnoId: number): Promise<void> {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
  const [m, alumno] = await Promise.all([
    prisma.materialEstudio.findUnique({ where: { id: materialId }, select: { id: true } }),
    prisma.usuario.findUnique({ where: { id: alumnoId }, select: { rolFamiliar: true } }),
  ]);
  if (!m) throw new NoEncontradoError("Material no encontrado");
  if (!alumno || (alumno.rolFamiliar !== "Hijo" && alumno.rolFamiliar !== "Hija")) throw new DatoInvalidoError("La impresión extra es para un hijo o una hija");
  await prisma.impresionMaterial.create({ data: { materialId, alumnoId, tipo: "extra", otorgadaPorId: a.id } });
}

export type HojaImpresa = { material: MaterialVista; alumno: string; fecha: string; materia: string | null };

/** La hoja de texto de una impresión ya registrada: vale 15 minutos y solo para quien la pidió (o un padre) */
export async function hojaPorToken(a: Actor, token: string): Promise<HojaImpresa> {
  const fila = await prisma.impresionMaterial.findUnique({ where: { token }, include: { alumno: { select: { id: true, nombre: true } } } });
  if (!fila) throw new NoEncontradoError("Esta hoja no existe");
  if (!esPadre(a.rol) && fila.alumnoId !== a.id) throw new NoAutorizadoError("Esta hoja es de otra persona");
  if (Date.now() - fila.createdAt.getTime() > MINUTOS_HOJA_IMPRESA * 60_000) throw new ConflictoError("Esta hoja ya caducó. Volvé a pedirla desde el material.");
  const material = await obtenerMaterial(a, fila.materialId);
  const leccion = material.leccionId ? await prisma.leccionCurso.findUnique({ where: { id: material.leccionId }, select: { recurso: { select: { materia: { select: { nombre: true } } } } } }) : null;
  const dia = material.diaLectivoId ? await prisma.diaLectivo.findUnique({ where: { id: material.diaLectivoId }, select: { plan: { select: { recurso: { select: { materia: { select: { nombre: true } } } } } } } }) : null;
  return {
    material,
    alumno: fila.alumno.nombre,
    fecha: fila.createdAt.toISOString().slice(0, 10),
    materia: leccion?.recurso.materia.nombre ?? dia?.plan.recurso.materia.nombre ?? null,
  };
}
