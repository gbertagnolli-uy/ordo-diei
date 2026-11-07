// Premio grupal, lado servidor (lane 274). Se evalúa al consultarlo (sin cron), como la meta semanal (lane 202).
import prisma from "../prisma.ts";
import { aClave, aFecha, hoyEnFamilia, NoAutorizadoError } from "../habitos/server.ts";
import { esPadre } from "../habitos/permisos.ts";
import { rangoDelDia } from "../comportamiento/sancionServer.ts";
import { crearVale } from "../recompensas/vales.ts";
import { esVisible, estadoPremio, porcentajeGrupal, seSolapan, validarPremioGrupal, type EstadoPremioGrupal } from "./premioGrupal.ts";

const ROLES_HIJOS = ["Hijo", "Hija"] as const;
const ESTADOS_HECHOS = ["Aprobada", "Completada"] as const;
/** Inicio (instante) del día `clave` en la zona de la familia (mismo truco que metaServidor) */
const inicioDe = (clave: string) => rangoDelDia(new Date(`${clave}T15:00:00Z`)).desde;
const diaSiguiente = (clave: string) => aClave(new Date(aFecha(clave).getTime() + 86_400_000));

export type PremioGrupalVista = {
  id: number;
  titulo: string;
  descripcion: string | null;
  porcentajeMeta: number;
  desde: string;
  hasta: string;
  activo: boolean;
  estado: EstadoPremioGrupal;
  porcentaje: number;
  hechas: number;
  total: number;
};

/** Tareas (instancias, no reglas) de los hijos que vencen en el período, y cuántas están hechas */
async function contarTareas(desde: string, hasta: string): Promise<{ hechas: number; total: number }> {
  const where = {
    tipoRecurrencia: "Unica" as const,
    fechaVencimiento: { gte: inicioDe(desde), lt: inicioDe(diaSiguiente(hasta)) },
    asignado: { rolFamiliar: { in: [...ROLES_HIJOS] } },
  };
  const [total, hechas] = await Promise.all([
    prisma.tarea.count({ where }),
    prisma.tarea.count({ where: { ...where, estado: { in: [...ESTADOS_HECHOS] } } }),
  ]);
  return { hechas, total };
}

type Fila = NonNullable<Awaited<ReturnType<typeof prisma.premioGrupal.findFirst>>>;

/** Terminado y sin evaluar: se evalúa una sola vez; si se llegó a la meta, un vale para cada hijo */
async function evaluarSiTermino(fila: Fila, hoy: string): Promise<Fila> {
  if (fila.evaluadoEn || !fila.activo || hoy <= aClave(fila.hasta)) return fila;
  const { hechas, total } = await contarTareas(aClave(fila.desde), aClave(fila.hasta));
  const porcentaje = porcentajeGrupal(hechas, total);
  const cumplido = total > 0 && porcentaje >= fila.porcentajeMeta;
  await prisma.$transaction(async (tx) => {
    const r = await tx.premioGrupal.updateMany({
      where: { id: fila.id, evaluadoEn: null },
      data: { evaluadoEn: new Date(), cumplido, porcentajeFinal: porcentaje },
    });
    if (r.count === 0 || !cumplido) return;
    const hijos = await tx.usuario.findMany({ where: { rolFamiliar: { in: [...ROLES_HIJOS] } }, select: { id: true } });
    for (const h of hijos) await crearVale(tx, h.id, fila.titulo, `Premio grupal · ${aClave(fila.desde)} al ${aClave(fila.hasta)}`);
  });
  return (await prisma.premioGrupal.findUnique({ where: { id: fila.id } })) ?? fila;
}

async function aVista(fila: Fila, hoy: string): Promise<PremioGrupalVista> {
  const desde = aClave(fila.desde);
  const hasta = aClave(fila.hasta);
  const evaluado = fila.evaluadoEn !== null;
  const conteo = evaluado || hoy >= desde ? await contarTareas(desde, hasta) : { hechas: 0, total: 0 };
  return {
    id: fila.id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    porcentajeMeta: fila.porcentajeMeta,
    desde,
    hasta,
    activo: fila.activo,
    estado: estadoPremio({ desde, hasta, evaluado, cumplido: fila.cumplido }, hoy),
    porcentaje: evaluado && fila.porcentajeFinal !== null ? fila.porcentajeFinal : porcentajeGrupal(conteo.hechas, conteo.total),
    hechas: conteo.hechas,
    total: conteo.total,
  };
}

/** El premio que ve la familia: el activo más reciente que ya empezó y sigue visible (D5) */
export async function premioGrupalVigente(): Promise<PremioGrupalVista | null> {
  const hoy = hoyEnFamilia();
  const filas = await prisma.premioGrupal.findMany({
    where: { activo: true, desde: { lte: aFecha(hoy) } },
    orderBy: { desde: "desc" },
    take: 5,
  });
  const fila = filas.find((f) => esVisible({ desde: aClave(f.desde), hasta: aClave(f.hasta) }, hoy));
  if (!fila) return null;
  return aVista(await evaluarSiTermino(fila, hoy), hoy);
}

export async function listarPremiosGrupales(actor: { rol?: string }): Promise<PremioGrupalVista[]> {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo los padres administran el premio grupal");
  const hoy = hoyEnFamilia();
  const filas = await prisma.premioGrupal.findMany({ orderBy: { desde: "desc" }, take: 30 });
  const evaluadas = [];
  for (const f of filas) evaluadas.push(await evaluarSiTermino(f, hoy));
  return Promise.all(evaluadas.map((f) => aVista(f, hoy)));
}

export async function crearPremioGrupal(actor: { id: number; rol?: string }, entrada: Record<string, unknown>) {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo los padres administran el premio grupal");
  const datos = validarPremioGrupal(entrada);
  const activos = await prisma.premioGrupal.findMany({ where: { activo: true }, select: { desde: true, hasta: true } });
  if (activos.some((a) => seSolapan({ desde: aClave(a.desde), hasta: aClave(a.hasta) }, datos))) {
    throw new Error("Ya hay un premio grupal activo en esas fechas");
  }
  await prisma.premioGrupal.create({
    data: {
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      porcentajeMeta: datos.porcentajeMeta,
      desde: aFecha(datos.desde),
      hasta: aFecha(datos.hasta),
      creadoPorId: actor.id,
    },
  });
}

/** Archivar: deja de verse y no se evalúa. Uno ya evaluado (vales entregados) también se puede archivar. */
export async function archivarPremioGrupal(actor: { rol?: string }, id: number) {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo los padres administran el premio grupal");
  await prisma.premioGrupal.update({ where: { id }, data: { activo: false } });
}
