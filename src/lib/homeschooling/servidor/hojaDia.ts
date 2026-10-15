// Propio de Ordo (lane 178, P3): la hoja imprimible del día. Reúne lo que le toca a un alumno ese día —curso, páginas o lecciones,
// minutos, instrucciones y el material de texto que dejó el padre— para llevarlo al cuaderno. El alumno puede imprimirla 2 veces
// (más las que le dé un padre); un padre, sin tope. Misma mecánica que la impresión de un material (impresiones.ts).
import { randomUUID } from "node:crypto";
import prisma from "../../prisma.ts";
import { aClave, NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { rangoTexto } from "../dia.ts";
import { IMPRESIONES_HOJA_DIA, impresionesRestantes, MINUTOS_HOJA_IMPRESA } from "../material.ts";
import { ConflictoError } from "./planes.ts";
import { TIPOS_CON_LECCIONES } from "./progreso.ts";
import type { Actor } from "./materiales.ts";

export type HojaDia = {
  alumno: string;
  fecha: string;
  materia: string;
  curso: string;
  rango: string;
  minutos: number;
  lecciones: { orden: number; titulo: string; instrucciones: string | null; textos: { titulo: string; contenido: string; markdown: boolean }[]; enlaces: string[] }[];
  textosDelDia: { titulo: string; contenido: string; markdown: boolean }[];
  enlacesDelDia: string[];
};

async function cargarDia(diaId: number) {
  const d = await prisma.diaLectivo.findUnique({
    where: { id: diaId },
    include: {
      materiales: { orderBy: [{ orden: "asc" }, { id: "asc" }] },
      plan: { select: { alumnoId: true, alumno: { select: { nombre: true } }, recurso: { select: { id: true, titulo: true, tipo: true, unidadTipo: true, minutosPorUnidad: true, materia: { select: { nombre: true } }, lecciones: { orderBy: { orden: "asc" }, include: { materiales: { orderBy: [{ orden: "asc" }, { id: "asc" }] } } } } } } },
    },
  });
  if (!d) throw new NoEncontradoError("Día no encontrado");
  return d;
}

type DiaCargado = Awaited<ReturnType<typeof cargarDia>>;

function armar(d: DiaCargado): HojaDia {
  const r = d.plan.recurso;
  const conLecciones = TIPOS_CON_LECCIONES.includes(r.tipo);
  const aTexto = (m: { titulo: string; tipo: string; contenido: string | null }) => (m.contenido !== null ? { titulo: m.titulo, contenido: m.contenido, markdown: m.tipo === "markdown" } : null);
  const enlace = (m: { titulo: string; url: string | null; contenido: string | null }) => (m.contenido === null ? m.titulo : null);
  const quitaNulos = <T,>(xs: (T | null)[]) => xs.filter((x): x is T => x !== null);
  return {
    alumno: d.plan.alumno.nombre,
    fecha: aClave(d.fecha),
    materia: r.materia.nombre,
    curso: r.titulo,
    rango: rangoTexto(r.unidadTipo, d.unidadDesde, d.unidadHasta),
    minutos: (d.unidadHasta - d.unidadDesde + 1) * r.minutosPorUnidad,
    lecciones: conLecciones
      ? r.lecciones
          .filter((l) => l.orden >= d.unidadDesde && l.orden <= d.unidadHasta)
          .map((l) => ({ orden: l.orden, titulo: l.titulo, instrucciones: l.instrucciones, textos: quitaNulos(l.materiales.map(aTexto)), enlaces: quitaNulos(l.materiales.map(enlace)) }))
      : [],
    textosDelDia: quitaNulos(d.materiales.map(aTexto)),
    enlacesDelDia: quitaNulos(d.materiales.map(enlace)),
  };
}

function exigirAcceso(a: Actor, d: DiaCargado) {
  if (!esPadre(a.rol) && d.plan.alumnoId !== a.id) throw new NoAutorizadoError("Este día no es tuyo");
}

/** Impresiones de la hoja que le quedan al alumno de un día */
export async function hojasRestantes(alumnoId: number, diaIds: number[]): Promise<Map<number, number>> {
  const mapa = new Map<number, number>(diaIds.map((id) => [id, IMPRESIONES_HOJA_DIA]));
  if (diaIds.length === 0) return mapa;
  const filas = await prisma.impresionDia.groupBy({ by: ["diaLectivoId", "tipo"], where: { alumnoId, diaLectivoId: { in: diaIds } }, _count: { _all: true } });
  const uso = new Map<number, { usadas: number; extras: number }>();
  for (const f of filas) {
    const u = uso.get(f.diaLectivoId) ?? { usadas: 0, extras: 0 };
    if (f.tipo === "extra") u.extras += f._count._all;
    else if (f.tipo === "uso") u.usadas += f._count._all;
    uso.set(f.diaLectivoId, u);
  }
  for (const [id, u] of uso) mapa.set(id, impresionesRestantes(IMPRESIONES_HOJA_DIA, u.usadas, u.extras));
  return mapa;
}

export async function registrarImpresionDia(a: Actor, diaId: number): Promise<{ restantes: number | null; hojaUrl: string }> {
  const d = await cargarDia(diaId);
  exigirAcceso(a, d);
  const token = randomUUID();
  const url = `/dashboard/homeschooling/imprimir/dia/${token}`;
  if (esPadre(a.rol)) {
    await prisma.impresionDia.create({ data: { diaLectivoId: diaId, alumnoId: d.plan.alumnoId, tipo: "padre", token } });
    return { restantes: null, hojaUrl: url };
  }
  return prisma.$transaction(
    async (tx) => {
      const filas = await tx.impresionDia.groupBy({ by: ["tipo"], where: { diaLectivoId: diaId, alumnoId: a.id }, _count: { _all: true } });
      const usadas = filas.find((f) => f.tipo === "uso")?._count._all ?? 0;
      const extras = filas.find((f) => f.tipo === "extra")?._count._all ?? 0;
      if (impresionesRestantes(IMPRESIONES_HOJA_DIA, usadas, extras) <= 0) throw new ConflictoError("Ya usaste las impresiones de la hoja de hoy. Pedile una más a mamá o a papá.");
      await tx.impresionDia.create({ data: { diaLectivoId: diaId, alumnoId: a.id, tipo: "uso", token } });
      return { restantes: impresionesRestantes(IMPRESIONES_HOJA_DIA, usadas + 1, extras), hojaUrl: url };
    },
    { isolationLevel: "Serializable" }
  );
}

export async function darImpresionExtraDia(a: Actor, diaId: number): Promise<void> {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
  const d = await prisma.diaLectivo.findUnique({ where: { id: diaId }, select: { plan: { select: { alumnoId: true } } } });
  if (!d) throw new NoEncontradoError("Día no encontrado");
  await prisma.impresionDia.create({ data: { diaLectivoId: diaId, alumnoId: d.plan.alumnoId, tipo: "extra", otorgadaPorId: a.id } });
}

export async function resumenHojaDia(a: Actor, diaId: number): Promise<{ usadas: number; permitidas: number }> {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
  const filas = await prisma.impresionDia.groupBy({ by: ["tipo"], where: { diaLectivoId: diaId }, _count: { _all: true } });
  const usadas = filas.find((f) => f.tipo === "uso")?._count._all ?? 0;
  const extras = filas.find((f) => f.tipo === "extra")?._count._all ?? 0;
  return { usadas, permitidas: IMPRESIONES_HOJA_DIA + extras };
}

export async function hojaDiaPorToken(a: Actor, token: string): Promise<HojaDia> {
  const fila = await prisma.impresionDia.findUnique({ where: { token } });
  if (!fila) throw new NoEncontradoError("Esta hoja no existe");
  if (!esPadre(a.rol) && fila.alumnoId !== a.id) throw new NoAutorizadoError("Esta hoja es de otra persona");
  if (Date.now() - fila.createdAt.getTime() > MINUTOS_HOJA_IMPRESA * 60_000) throw new ConflictoError("Esta hoja ya caducó. Volvé a pedirla desde «Hoy».");
  return armar(await cargarDia(fila.diaLectivoId));
}

