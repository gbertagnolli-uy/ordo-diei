// Bitácora de comportamiento (vault/LANE_80_PANEL_ADMIN_COMPORTAMIENTO.md): los padres registran
// la conducta de cada hijo y, si es positiva, le dejan un premio sorpresa en «Mis premios».
import type { Prisma } from "@prisma/client";
import prisma from "../prisma.ts";
import { esPadre } from "../habitos/permisos.ts";
import { NoAutorizadoError, NoEncontradoError } from "../habitos/server.ts";
import { regalarCartaEnTx } from "../cartas/server.ts";
import { APP_TZ, inicioDelDiaEnTz } from "../cartas/eventos.ts";
import { contenidoCofre, diaEsBueno, elegirRareza, HORA_COFRE } from "./cofre.ts";
import { esAutomatico, leerItems, textoItem, validarItems, MAX_CANTIDAD, MAX_TEXTO, type ItemPremio } from "./premios.ts";

export type ComportamientoVista = {
  id: number;
  tipo: "Positivo" | "Negativo";
  titulo: string;
  evaluacion: string | null;
  premios: ItemPremio[];
  penitencia: string | null;
  puntosPenalizados: number;
  createdAt: string;
  usuario: { id: number; nombre: string; fotoUrl: string | null };
  registradoPor: { id: number; nombre: string };
  /** Estado del premio sorpresa: disponible → reclamado (falta que un padre cumpla algo) → entregado */
  estadoPremio: "disponible" | "reclamado" | "entregado" | null;
};

const INCLUDE = {
  usuario: { select: { id: true, nombre: true, fotoUrl: true } },
  registradoPor: { select: { id: true, nombre: true } },
  recompensa: { select: { estado: true } },
} as const;

type Fila = Awaited<ReturnType<typeof prisma.comportamiento.findMany<{ include: typeof INCLUDE }>>>[number];

const aVista = (c: Fila): ComportamientoVista => ({
  id: c.id,
  tipo: c.tipo,
  titulo: c.titulo,
  evaluacion: c.evaluacion,
  premios: leerItems(c.premios),
  penitencia: c.penitencia,
  puntosPenalizados: c.puntosPenalizados,
  createdAt: c.createdAt.toISOString(),
  usuario: c.usuario,
  registradoPor: c.registradoPor,
  estadoPremio: c.recompensa?.estado ?? null,
});

function exigirPadre(rol?: string) {
  if (!esPadre(rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden gestionar el comportamiento");
}

export async function listarComportamientos(rol?: string, usuarioId?: number): Promise<ComportamientoVista[]> {
  exigirPadre(rol);
  const filas = await prisma.comportamiento.findMany({
    where: usuarioId ? { usuarioId } : undefined,
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return filas.map(aVista);
}

export async function registrarComportamiento(
  actor: { id: number; rol?: string },
  entrada: Record<string, unknown>
): Promise<void> {
  exigirPadre(actor.rol);

  // Uno o varios destinatarios: cada uno recibe su propio registro y su propio premio sorpresa
  const pedidos = Array.isArray(entrada.usuarioIds) ? entrada.usuarioIds : [entrada.usuarioId];
  const usuarioIds = [...new Set(pedidos.map(Number).filter(Number.isInteger))];
  const titulo = typeof entrada.titulo === "string" ? entrada.titulo.trim() : "";
  const evaluacion = typeof entrada.evaluacion === "string" ? entrada.evaluacion.trim() : "";
  const positivo = entrada.tipo !== "Negativo";

  if (usuarioIds.length === 0) throw new Error("Elegí a quién corresponde");
  if (!titulo) throw new Error("Escribí el título del comportamiento");
  if (titulo.length > 120) throw new Error("El título no puede superar los 120 caracteres");
  if (evaluacion.length > 1000) throw new Error("La evaluación no puede superar los 1000 caracteres");

  const existentes = await prisma.usuario.count({ where: { id: { in: usuarioIds } } });
  if (existentes !== usuarioIds.length) throw new NoEncontradoError("Usuario no encontrado");

  if (positivo) {
    const items = validarItems(entrada.premios);
    for (const i of items) {
      if (i.tipo !== "carta") continue;
      const carta = await prisma.carta.findUnique({ where: { id: i.cartaId }, select: { nombre: true } });
      if (!carta) throw new Error("Una de las cartas elegidas no existe");
      i.nombre = carta.nombre;
    }

    // Todo o nada: si falla uno, no queda ningún registro a medias
    await prisma.$transaction(
      usuarioIds.map((usuarioId) =>
        prisma.comportamiento.create({
          data: {
            usuarioId,
            registradoPorId: actor.id,
            tipo: "Positivo",
            titulo,
            evaluacion: evaluacion || null,
            premios: items,
            // Sin premios es solo una anotación en la bitácora: no hay sorpresa que reclamar
            ...(items.length > 0
              ? {
                  recompensa: {
                    create: { usuarioId, tipo: "comportamiento", titulo, origen: "Comportamiento", contenido: items },
                  },
                }
              : {}),
          },
        })
      )
    );
    return;
  }

  const penitencia = typeof entrada.penitencia === "string" ? entrada.penitencia.trim() : "";
  const puntos = entrada.puntosPenalizados === undefined || entrada.puntosPenalizados === "" ? 0 : Number(entrada.puntosPenalizados);
  if (penitencia.length > MAX_TEXTO) throw new Error(`La penitencia no puede superar los ${MAX_TEXTO} caracteres`);
  if (!Number.isInteger(puntos) || puntos < 0 || puntos > MAX_CANTIDAD) throw new Error("Los puntos a quitar no son válidos");

  await prisma.$transaction(async (tx) => {
    for (const usuarioId of usuarioIds) {
      let aplicados = 0;
      if (puntos > 0) {
        const u = await tx.usuario.findUniqueOrThrow({ where: { id: usuarioId }, select: { availablePoints: true } });
        aplicados = Math.min(puntos, u.availablePoints); // nunca deja saldo negativo
        if (aplicados > 0) {
          await tx.usuario.update({ where: { id: usuarioId }, data: { availablePoints: { decrement: aplicados } } });
        }
      }
      await tx.comportamiento.create({
        data: {
          usuarioId,
          registradoPorId: actor.id,
          tipo: "Negativo",
          titulo,
          evaluacion: evaluacion || null,
          penitencia: penitencia || null,
          puntosPenalizados: aplicados,
        },
      });
    }
  });
}

/** Elimina el registro; si el premio sorpresa todavía no se abrió, también desaparece de «Mis premios» */
export async function eliminarComportamiento(rol: string | undefined, id: number) {
  exigirPadre(rol);
  const c = await prisma.comportamiento.findUnique({ where: { id }, include: { recompensa: true } });
  if (!c) throw new NoEncontradoError("Registro no encontrado");
  await prisma.$transaction(async (tx) => {
    if (c.recompensa?.estado === "disponible") await tx.recompensa.delete({ where: { id: c.recompensa.id } });
    await tx.comportamiento.delete({ where: { id } });
  });
}

export type ResultadoApertura = { lineas: string[]; pendienteEntrega: boolean };

/**
 * El niño abre su premio sorpresa: se acreditan los premios de la economía (puntos, incienso, XP,
 * cartas) y los demás (exoneración, extra) quedan para que un padre los cumpla en «Para entregar».
 */
export async function abrirPremioSorpresa(usuarioId: number, id: number): Promise<ResultadoApertura> {
  return prisma.$transaction(async (tx) => {
    const r = await tx.recompensa.findUnique({ where: { id } });
    if (!r || (r.tipo !== "comportamiento" && r.tipo !== "cofre")) throw new NoEncontradoError("Premio no encontrado");
    if (r.usuarioId !== usuarioId) throw new NoAutorizadoError("Solo podés abrir tus propios premios");

    const items = leerItems(r.contenido);

    // Reclamo atómico: dos pestañas no pueden acreditar el mismo premio dos veces
    const pendienteEntrega = items.some((i) => !esAutomatico(i));
    const ahora = new Date();
    const reclamo = await tx.recompensa.updateMany({
      where: { id, estado: "disponible" },
      data: pendienteEntrega
        ? { estado: "reclamado", reclamadaEn: ahora }
        : { estado: "entregado", reclamadaEn: ahora, entregadaEn: ahora },
    });
    if (reclamo.count === 0) throw new Error("Este premio ya fue abierto");

    const puntos = items.reduce((n, i) => n + (i.tipo === "puntos" ? i.cantidad : 0), 0);
    const incienso = items.reduce((n, i) => n + (i.tipo === "incienso" ? i.cantidad : 0), 0);
    const xp = items.reduce((n, i) => n + (i.tipo === "xp" ? i.cantidad : 0), 0);
    if (puntos || incienso || xp) {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          ...(puntos ? { availablePoints: { increment: puntos }, puntosAcumulados: { increment: puntos } } : {}),
          ...(incienso ? { incienso: { increment: incienso } } : {}),
          ...(xp ? { experienciaHabitos: { increment: xp } } : {}),
        },
      });
    }

    for (const i of items) {
      if (i.tipo === "carta") {
        await regalarCartaEnTx(
          tx,
          usuarioId,
          i.cartaId,
          i.modo === "completa" ? { tipo: "completa" } : { tipo: "fragmentos", cantidad: i.cantidad ?? 1 },
          `Premio de comportamiento: ${r.titulo}`
        );
      }
    }

    return { lineas: items.map(textoItem), pendienteEntrega };
  });
}

const horaEnFamilia = (ahora: Date) =>
  Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: APP_TZ }).format(ahora));

/** Crea un cofre sorpresa con una carta al azar (por rareza). `origen` identifica el motivo. */
export async function crearCofre(cliente: Prisma.TransactionClient | typeof prisma, usuarioId: number, origen: string) {
  const rareza = elegirRareza();
  const candidatas = await cliente.carta.findMany({ where: { activa: true, rareza }, select: { id: true, nombre: true } });
  // Si no hay cartas de esa rareza, cae a cualquiera activa
  const pool = candidatas.length ? candidatas : await cliente.carta.findMany({ where: { activa: true }, select: { id: true, nombre: true } });
  if (pool.length === 0) throw new Error("No hay cartas activas para el cofre");
  const carta = pool[Math.floor(Math.random() * pool.length)];
  return cliente.recompensa.create({
    data: { usuarioId, tipo: "cofre", titulo: "Cofre sorpresa", origen, contenido: contenidoCofre(carta) },
  });
}

/**
 * Cofre del día: desde las 18:00, si los padres evaluaron bien el día de este usuario, recibe uno
 * (máximo uno por día). Se evalúa al entrar a la app, así que no hace falta un cron.
 * @returns true si se otorgó ahora.
 */
export async function otorgarCofreDelDia(usuarioId: number, ahora = new Date()): Promise<boolean> {
  if (horaEnFamilia(ahora) < HORA_COFRE) return false;
  const desde = inicioDelDiaEnTz(ahora, APP_TZ);
  const origen = `Buen comportamiento · ${desde.toISOString().slice(0, 10)}`;

  return prisma.$transaction(async (tx) => {
    // Un candado por usuario evita dos cofres si se abren dos pestañas a la vez
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${usuarioId}::bigint + 7000000)`;
    const yaTiene = await tx.recompensa.count({ where: { usuarioId, tipo: "cofre", origen } });
    if (yaTiene > 0) return false;
    const [positivos, negativos] = await Promise.all([
      tx.comportamiento.count({ where: { usuarioId, tipo: "Positivo", createdAt: { gte: desde } } }),
      tx.comportamiento.count({ where: { usuarioId, tipo: "Negativo", createdAt: { gte: desde } } }),
    ]);
    if (!diaEsBueno(positivos, negativos)) return false;

    await crearCofre(tx, usuarioId, origen);
    return true;
  });
}
