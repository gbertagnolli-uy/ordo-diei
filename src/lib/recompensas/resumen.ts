// Resumen de «Mis premios»: lo que el usuario tiene guardado y lo que generó hoy.
import prisma from "../prisma.ts";
import { APP_TZ, inicioDelDiaEnTz } from "../cartas/eventos.ts";
import { gradoDe } from "../cartas/fragmentos.ts";
import { aFecha, hoyEnFamilia } from "../habitos/server.ts";
import { xpTotal } from "../niveles.ts";
import { leerItems } from "../comportamiento/premios.ts";

export type ResumenDia = {
  totales: { puntos: number; xp: number; incienso: number };
  hoy: { puntos: number; xp: number; incienso: number; fragmentos: number };
};

export type CartaPorReclamar = { cartaId: number; nombre: string; gradoDisponible: number; imagenUrl: string };

export async function getResumenDia(usuarioId: number): Promise<ResumenDia> {
  const desde = inicioDelDiaEnTz(new Date(), APP_TZ);

  const [usuario, aprobadas, habitos, movimientos, abiertas] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { availablePoints: true, incienso: true, puntosAcumulados: true, experienciaHabitos: true },
    }),
    // Los puntos de una tarea se acreditan al aprobarla
    prisma.historialAccion.findMany({
      where: { estadoNuevo: "Aprobada", timestamp: { gte: desde }, tarea: { asignadoId: usuarioId } },
      select: { tarea: { select: { puntosGenerados: true } } },
    }),
    prisma.registroHabito.findMany({
      where: { usuarioId, fecha: aFecha(hoyEnFamilia()), aprobado: true },
      select: { puntos: true, xp: true },
    }),
    prisma.movimientoFragmento.findMany({
      where: { usuarioId, createdAt: { gte: desde }, cantidad: { gt: 0 }, tipo: { notIn: ["Compra", "CompraIncienso"] } },
      select: { cantidad: true, inciensoDelta: true },
    }),
    // Puntos, XP e incienso de los premios sorpresa y cofres abiertos hoy
    prisma.recompensa.findMany({
      where: { usuarioId, tipo: { in: ["comportamiento", "cofre", "reconocimiento"] }, reclamadaEn: { gte: desde } },
      select: { contenido: true },
    }),
  ]);

  const deTareas = aprobadas.reduce((n, a) => n + (a.tarea.puntosGenerados || 0), 0);
  const hoy = { puntos: deTareas, xp: deTareas, incienso: 0, fragmentos: 0 };
  for (const h of habitos) {
    hoy.puntos += h.puntos;
    hoy.xp += h.xp + h.puntos; // los puntos también cuentan como XP (vault/HABITOS_Y_NIVELES.md)
  }
  for (const m of movimientos) {
    hoy.fragmentos += m.cantidad;
    hoy.incienso += Math.max(0, m.inciensoDelta);
  }
  for (const r of abiertas) {
    for (const i of leerItems(r.contenido)) {
      if (i.tipo === "puntos") {
        hoy.puntos += i.cantidad;
        hoy.xp += i.cantidad;
      }
      if (i.tipo === "xp") hoy.xp += i.cantidad;
      if (i.tipo === "incienso") hoy.incienso += i.cantidad;
    }
  }

  return {
    totales: { puntos: usuario?.availablePoints ?? 0, xp: xpTotal(usuario), incienso: usuario?.incienso ?? 0 },
    hoy,
  };
}

/** Cartas que alcanzaron un grado que todavía no se reclamó (vault/ECONOMIA_CARTAS.md D20) */
export async function getCartasPorReclamar(usuarioId: number): Promise<CartaPorReclamar[]> {
  const filas = await prisma.cartaUsuario.findMany({
    where: { usuarioId, carta: { activa: true } },
    select: {
      fragmentos: true,
      gradoReclamado: true,
      carta: { select: { id: true, nombre: true, imagenUrl: true, fragmentosRequeridos: true } },
    },
  });
  return filas
    .map((f) => ({ f, grado: gradoDe(f.fragmentos, f.carta.fragmentosRequeridos) }))
    .filter(({ f, grado }) => grado > f.gradoReclamado)
    .map(({ f, grado }) => ({ cartaId: f.carta.id, nombre: f.carta.nombre, gradoDisponible: grado, imagenUrl: f.carta.imagenUrl }));
}
