// Meta semanal en familia, lado servidor (lane 202). Se evalúa al entrar: si la familia llegó al objetivo,
// cada hijo recibe un vale una sola vez (el reclamo es atómico), sin cron.
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import prisma from "../prisma.ts";
import { APP_TZ } from "../cartas/eventos.ts";
import { aClave, aFecha } from "../habitos/server.ts";
import { esPadre } from "../habitos/permisos.ts";
import { NoAutorizadoError } from "../habitos/server.ts";
import { rangoDelDia } from "../comportamiento/sancionServer.ts";
import { crearVale } from "../recompensas/vales.ts";
import { cumple, lunesAnterior, lunesDe, lunesSiguiente, porcentaje, sugerirObjetivo, validarMeta } from "./meta.ts";

const ROLES_HIJOS = ["Hijo", "Hija"] as const;
const diaDeFamilia = (ahora: Date) => format(ahora, "yyyy-MM-dd", { in: tz(APP_TZ) });

/** Inicio (instante) del día `clave` en la zona de la familia */
const inicioDe = (clave: string) => rangoDelDia(new Date(`${clave}T15:00:00Z`)).desde; // 15:00 UTC = mediodía en la familia

/** Logros de los hijos en la semana que empieza el `lunes`: tareas aprobadas + hábitos hechos y aprobados */
export async function logrosDeLaSemana(lunes: string): Promise<number> {
  const siguiente = lunesSiguiente(lunes);
  const [tareas, habitos] = await Promise.all([
    prisma.historialAccion.count({
      where: {
        estadoNuevo: "Aprobada",
        timestamp: { gte: inicioDe(lunes), lt: inicioDe(siguiente) },
        tarea: { asignado: { rolFamiliar: { in: [...ROLES_HIJOS] } } },
      },
    }),
    prisma.registroHabito.count({
      where: {
        marca: "hecho",
        aprobado: true,
        fecha: { gte: aFecha(lunes), lt: aFecha(siguiente) },
        usuario: { rolFamiliar: { in: [...ROLES_HIJOS] } },
      },
    }),
  ]);
  return tareas + habitos;
}

export type MetaSemanalVista = {
  semana: string;
  meta: { objetivo: number; premio: string; actual: number; porcentaje: number; cumplida: boolean } | null;
  /** Objetivo que se propone a los padres al fijar la meta (según la semana pasada) */
  sugerido: number;
  esPadre: boolean;
};

/** Entrega el vale a cada hijo una sola vez; devuelve true si lo entregó ahora */
async function entregarSiCumplio(meta: { id: number; semana: Date; premio: string }): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const r = await tx.metaSemanal.updateMany({ where: { id: meta.id, cumplidaEn: null }, data: { cumplidaEn: new Date() } });
    if (r.count === 0) return false;
    const hijos = await tx.usuario.findMany({ where: { rolFamiliar: { in: [...ROLES_HIJOS] } }, select: { id: true } });
    for (const h of hijos) await crearVale(tx, h.id, meta.premio, `Meta de la semana · ${aClave(meta.semana)}`);
    return true;
  });
}

export async function metaDeLaSemana(usuario: { id: number; rol?: string }, ahora: Date = new Date()): Promise<MetaSemanalVista> {
  const semana = lunesDe(diaDeFamilia(ahora));
  const fila = await prisma.metaSemanal.findUnique({ where: { semana: aFecha(semana) } });
  const padre = esPadre(usuario.rol);

  if (!fila) {
    // Sin meta: a los padres se les propone una según el ritmo de la semana pasada
    const sugerido = padre ? sugerirObjetivo(await logrosDeLaSemana(lunesAnterior(semana))) : 10;
    return { semana, meta: null, sugerido, esPadre: padre };
  }

  const actual = await logrosDeLaSemana(semana);
  let cumplida = fila.cumplidaEn !== null;
  if (!cumplida && cumple(actual, fila.objetivo)) cumplida = (await entregarSiCumplio(fila)) || true;
  return {
    semana,
    meta: { objetivo: fila.objetivo, premio: fila.premio, actual, porcentaje: porcentaje(actual, fila.objetivo), cumplida },
    sugerido: fila.objetivo,
    esPadre: padre,
  };
}

/** Un padre o madre fija (o corrige) la meta de esta semana; una vez cumplida ya no se cambia */
export async function fijarMetaSemanal(actor: { id: number; rol?: string }, entrada: Record<string, unknown>, ahora: Date = new Date()) {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden fijar la meta de la semana");
  const { objetivo, premio } = validarMeta(entrada);
  const semana = aFecha(lunesDe(diaDeFamilia(ahora)));
  const previa = await prisma.metaSemanal.findUnique({ where: { semana } });
  if (previa?.cumplidaEn) throw new Error("La meta de esta semana ya se cumplió: la próxima la fijás el lunes");
  await prisma.metaSemanal.upsert({
    where: { semana },
    create: { semana, objetivo, premio, creadaPorId: actor.id },
    update: { objetivo, premio },
  });
}
