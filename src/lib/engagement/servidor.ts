// Ingreso diario, racha y «Tu parte de hoy» (vault/ENGAGEMENT_PLAN.md, lane 201): lado servidor.
// Todo se evalúa al entrar, sin cron, y es idempotente (un candado por persona evita premiar dos veces).
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import { Prisma } from "@prisma/client";
import prisma from "../prisma.ts";
import { APP_TZ } from "../cartas/eventos.ts";
import { aClave, aFecha } from "../habitos/server.ts";
import { esPadre } from "../habitos/permisos.ts";
import { contenidoCofre, elegirRareza } from "../comportamiento/cofre.ts";
import { otorgarCofreDelDia } from "../comportamiento/server.ts";
import { rangoDelDia } from "../comportamiento/sancionServer.ts";
import type { ItemPremio } from "../comportamiento/premios.ts";
import { calcularRachaApp, type RachaApp } from "./racha.ts";
import { hitosAlcanzados, origenHito, proximoHito, type Hito } from "./hitos.ts";
import { cofreGanado, misionesDeHoy, PUNTOS_MISION, type Mision } from "./misiones.ts";

type Cliente = Prisma.TransactionClient | typeof prisma;

const DIAS_HISTORIAL = 400;
const diaDeFamilia = (ahora: Date) => format(ahora, "yyyy-MM-dd", { in: tz(APP_TZ) });

/** Días en que la persona entró, hasta `hoy` inclusive (ya en la zona de la familia) */
async function fechasDeIngreso(cliente: Cliente, usuarioId: number, hoy: string): Promise<string[]> {
  const desde = new Date(aFecha(hoy).getTime() - DIAS_HISTORIAL * 86_400_000);
  const filas = await cliente.actividadDia.findMany({
    where: { usuarioId, fecha: { gte: desde } },
    select: { fecha: true },
  });
  return filas.map((f) => aClave(f.fecha));
}

export async function rachaDe(usuarioId: number, ahora: Date = new Date()): Promise<RachaApp> {
  const hoy = diaDeFamilia(ahora);
  return calcularRachaApp(await fechasDeIngreso(prisma, usuarioId, hoy), hoy);
}

/** Una carta al azar (por rareza, como el cofre) para el fragmento de un premio */
async function cartaAlAzar(cliente: Cliente) {
  const candidatas = await cliente.carta.findMany({ where: { activa: true, rareza: elegirRareza() }, select: { id: true, nombre: true } });
  const pool = candidatas.length ? candidatas : await cliente.carta.findMany({ where: { activa: true }, select: { id: true, nombre: true } });
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

async function itemsConCarta(cliente: Cliente, puntos: number, xp: number, fragmentos: number): Promise<ItemPremio[]> {
  const items: ItemPremio[] = [
    { tipo: "puntos", cantidad: puntos },
    { tipo: "xp", cantidad: xp },
  ];
  const carta = fragmentos > 0 ? await cartaAlAzar(cliente) : null;
  if (carta) items.push({ tipo: "carta", cartaId: carta.id, nombre: carta.nombre, modo: "fragmentos", cantidad: fragmentos });
  return items;
}

/** Premio sorpresa por llegar a un hito: llega a «Mis premios» y se abre como los demás (con las reglas de la sanción) */
async function otorgarHitos(cliente: Cliente, usuarioId: number, racha: RachaApp): Promise<Hito[]> {
  if (!racha.inicio) return [];
  const nuevos: Hito[] = [];
  for (const h of hitosAlcanzados(racha.dias)) {
    const origen = origenHito(h, racha.inicio);
    const existe = await cliente.recompensa.count({ where: { usuarioId, tipo: "comportamiento", origen } });
    if (existe > 0) continue;
    await cliente.recompensa.create({
      data: { usuarioId, tipo: "comportamiento", titulo: h.titulo, origen, contenido: await itemsConCarta(cliente, h.puntos, h.xp, h.fragmentos) },
    });
    nuevos.push(h);
  }
  return nuevos;
}

/**
 * Anota que la persona entró hoy (una sola vez por día) y, si con eso alcanza un hito de racha, deja el premio.
 * Es barato en las visitas repetidas: una lectura por la clave única.
 */
export async function registrarIngreso(usuarioId: number, ahora: Date = new Date()): Promise<{ nuevo: boolean; hitos: Hito[] }> {
  const hoy = diaDeFamilia(ahora);
  const fecha = aFecha(hoy);
  const ya = await prisma.actividadDia.findUnique({ where: { usuarioId_fecha: { usuarioId, fecha } }, select: { id: true } });
  if (ya) return { nuevo: false, hitos: [] };
  try {
    await prisma.actividadDia.create({ data: { usuarioId, fecha } });
  } catch (e) {
    // Dos pestañas a la vez: la otra ya lo anotó
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { nuevo: false, hitos: [] };
    throw e;
  }
  const racha = calcularRachaApp(await fechasDeIngreso(prisma, usuarioId, hoy), hoy);
  return { nuevo: true, hitos: await otorgarHitos(prisma, usuarioId, racha) };
}

// ─────────────────────────────── «Tu parte de hoy» (padres) ───────────────────────────────

export type ParteDeHoy = {
  racha: RachaApp;
  proximoHito: { dias: number; faltan: number } | null;
  misiones: Mision[];
  hechas: number;
  /** Se cumplieron todas las misiones */
  completa: boolean;
  /** Registró el comportamiento de todos los hijos y el cofre de «Tu parte de hoy» ya está en «Mis premios» */
  cofre: boolean;
  /** Puntos que sumaron las misiones de hoy */
  puntosHoy: number;
};

const leerClaves = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Hijos de la familia y si ya tienen un registro de comportamiento hoy, lo haya cargado el padre que sea */
async function hijosConRegistroHoy(ahora: Date) {
  const { desde, hasta } = rangoDelDia(ahora);
  const fecha = aFecha(diaDeFamilia(ahora));
  const [hijosDb, registros, conductas] = await Promise.all([
    prisma.usuario.findMany({ where: { rolFamiliar: { in: ["Hijo", "Hija"] } }, select: { id: true, nombre: true }, orderBy: { id: "asc" } }),
    prisma.comportamiento.findMany({ where: { createdAt: { gte: desde, lt: hasta } }, select: { usuarioId: true }, distinct: ["usuarioId"] }),
    prisma.conductaDia.findMany({ where: { fecha }, select: { usuarioId: true } }),
  ]);
  const conRegistro = new Set([...registros, ...conductas].map((r) => r.usuarioId));
  return hijosDb.map((h) => ({ id: h.id, nombre: h.nombre, registradoHoy: conRegistro.has(h.id) }));
}

/** Deja el cofre de «Tu parte de hoy» en «Mis premios» si todavía no está (idempotente). @returns true si lo creó. */
async function darCofreDeLaParte(tx: Cliente, usuarioId: number, hoy: string): Promise<boolean> {
  const origen = `Tu parte de hoy · ${hoy}`;
  if ((await tx.recompensa.count({ where: { usuarioId, tipo: "comportamiento", origen } })) > 0) return false;
  const carta = await cartaAlAzar(tx);
  await tx.recompensa.create({
    data: { usuarioId, tipo: "comportamiento", titulo: "Cofre de tu parte de hoy", origen, contenido: carta ? contenidoCofre(carta) : [{ tipo: "puntos", cantidad: 10 }] },
  });
  return true;
}

/**
 * Cuando ya están registrados todos los hijos de hoy, por el padre que sea, desbloquea el cofre de TODOS los
 * administradores sin esperar a que entren a la app. Se llama al registrar comportamiento o conducta.
 * @returns ids de los padres que recibieron el cofre ahora.
 */
export async function desbloquearCofresDePadres(ahora: Date = new Date()): Promise<number[]> {
  const hijos = await hijosConRegistroHoy(ahora);
  await Promise.allSettled(
    hijos.filter((h) => h.registradoHoy).map((h) => otorgarCofreDelDia(h.id, ahora))
  );
  if (hijos.length === 0 || hijos.some((h) => !h.registradoHoy)) return [];
  const hoy = diaDeFamilia(ahora);
  const padres = await prisma.usuario.findMany({ where: { rolFamiliar: { in: ["Padre", "Madre"] } }, select: { id: true } });
  const nuevos: number[] = [];
  for (const p of padres) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${p.id}::bigint + 8000000)`;
      if (await darCofreDeLaParte(tx, p.id, hoy)) nuevos.push(p.id);
    });
  }
  return nuevos;
}

/**
 * Evalúa las misiones de hoy, premia las que se cumplieron (puntos) y, cuando están todas, deja un premio
 * sorpresa. Se puede llamar las veces que haga falta: cada misión se premia una sola vez por día.
 */
export async function parteDeHoy(usuario: { id: number; rol?: string }, ahora: Date = new Date()): Promise<ParteDeHoy | null> {
  if (!esPadre(usuario.rol)) return null;
  const hoy = diaDeFamilia(ahora);
  const fecha = aFecha(hoy);
  // Quien crea la fila del día es siempre registrarIngreso (ahí se entregan los hitos de racha)
  await registrarIngreso(usuario.id, ahora);
  const { desde, hasta } = rangoDelDia(ahora);
  const hoyRango = { gte: desde, lt: hasta };

  const [hijos, materiales, comentarios, calificaciones, pendientes, aprobadasHoy, mensajes, publicaciones, fechas] = await Promise.all([
    hijosConRegistroHoy(ahora),
    prisma.materialEstudio.count({ where: { creadorId: usuario.id, createdAt: hoyRango } }),
    prisma.comentarioEstudio.count({ where: { autorId: usuario.id, createdAt: hoyRango } }),
    prisma.calificacion.count({ where: { calificadaPorId: usuario.id, createdAt: hoyRango } }),
    prisma.tarea.count({ where: { estado: "Esperando_Aprobacion" } }),
    prisma.historialAccion.count({ where: { actorId: usuario.id, estadoNuevo: "Aprobada", timestamp: hoyRango } }),
    prisma.mensajeFamilia.count({ where: { deId: usuario.id, createdAt: hoyRango } }),
    prisma.publicacionFamilia.count({ where: { autorId: usuario.id, createdAt: hoyRango } }),
    fechasDeIngreso(prisma, usuario.id, hoy),
  ]);
  await Promise.allSettled(
    hijos.filter((h) => h.registradoHoy).map((h) => otorgarCofreDelDia(h.id, ahora))
  );

  const contexto = {
    hijos,
    estudioHoy: materiales + comentarios + calificaciones,
    pendientes,
    aprobadasHoy,
    mensajesHoy: mensajes + publicaciones,
  };

  const { misiones, cofre, puntosHoy } = await prisma.$transaction(async (tx) => {
    // Un candado por persona evita premiar dos veces si se abren dos pestañas a la vez
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${usuario.id}::bigint + 8000000)`;
    const fila = await tx.actividadDia.findUniqueOrThrow({ where: { usuarioId_fecha: { usuarioId: usuario.id, fecha } } });
    const premiadas = leerClaves(fila.misiones);
    const lista = misionesDeHoy(contexto, premiadas);

    const nuevas = lista.filter((m) => m.hecha && !premiadas.includes(m.clave));
    const claves = [...premiadas, ...nuevas.map((m) => m.clave)];
    const premioFinal = cofreGanado(lista) && !premiadas.includes("completo");
    if (premioFinal) claves.push("completo");

    const puntos = nuevas.reduce((n, m) => n + m.puntos, 0);
    if (puntos > 0) {
      await tx.usuario.update({ where: { id: usuario.id }, data: { availablePoints: { increment: puntos }, puntosAcumulados: { increment: puntos } } });
    }
    // Puede que otro administrador ya haya desbloqueado el cofre al registrar a los hijos: no se duplica
    if (premioFinal) await darCofreDeLaParte(tx, usuario.id, hoy);
    if (claves.length !== premiadas.length) {
      await tx.actividadDia.update({ where: { id: fila.id }, data: { misiones: claves } });
    }
    const final = misionesDeHoy(contexto, claves);
    return { misiones: final, cofre: claves.includes("completo"), puntosHoy: final.filter((m) => m.hecha).length * PUNTOS_MISION };
  });

  const racha = calcularRachaApp(fechas, hoy);
  const sig = proximoHito(racha.dias);
  return {
    racha,
    proximoHito: sig ? { dias: sig.dias, faltan: sig.dias - racha.dias } : null,
    misiones,
    hechas: misiones.filter((m) => m.hecha).length,
    completa: misiones.length > 0 && misiones.every((m) => m.hecha),
    cofre,
    puntosHoy,
  };
}
