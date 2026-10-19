import prisma from "./prisma.ts";
import { nivelDe, xpTotal, PUNTOS_SUBIR_NIVEL, badgeDeNivel } from "./niveles.ts";

export interface ReclamoNivelResultado {
  reclamado: boolean;
  nivel: number;
  titulo: string;
  badgeUrl: string;
  puntosRegalo: number;
  nivelesSubidos: number;
  nuevoSaldoPuntos: number;
}

/**
 * Reclama la subida de nivel del usuario de forma idempotente:
 * - Usa `Companero.nivelVisto` como último nivel premiado/visto (si no existe fila en `Companero`,
 *   toma `nivelPrevio` del cliente acotado a >= 1, o el nivel actual si no se indica).
 * - Por cada nivel nuevo alcanzado (`nivelActual - base`), regala `PUNTOS_SUBIR_NIVEL` (200 puntos)
 *   en `availablePoints` (sin tocar `puntosAcumulados` para no alterar la XP ni disparar otro nivel).
 * - Guarda `nivelVisto = nivelActual` dentro de una transacción con lock por usuario.
 */
export async function reclamarSubidaNivel(
  usuarioId: number,
  nivelPrevioCliente?: number | null,
): Promise<ReclamoNivelResultado> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${usuarioId}::bigint + 9000000)`;

    const [usuario, companero] = await Promise.all([
      tx.usuario.findUniqueOrThrow({
        where: { id: usuarioId },
        select: { puntosAcumulados: true, experienciaHabitos: true, availablePoints: true },
      }),
      tx.companero.findUnique({
        where: { usuarioId },
        select: { id: true, nivelVisto: true },
      }),
    ]);

    const info = nivelDe(xpTotal(usuario));
    const nivelActual = info.level;

    // Determinar desde qué nivel se calcula la subida
    let base: number;
    if (companero && companero.nivelVisto > 0) {
      base = companero.nivelVisto;
    } else if (typeof nivelPrevioCliente === "number" && Number.isFinite(nivelPrevioCliente) && nivelPrevioCliente >= 1) {
      base = Math.min(Math.floor(nivelPrevioCliente), nivelActual);
    } else {
      // Primera vez que se registra sin nivel previo conocido: si ya está en nivel > 1 y se disparó reclamo sin nivelPrevio,
      // o bien no hay subida pendiente
      base = nivelActual;
    }

    const nivelesSubidos = Math.max(0, nivelActual - base);
    const puntosRegalo = nivelesSubidos * PUNTOS_SUBIR_NIVEL;

    let nuevoSaldoPuntos = usuario.availablePoints;

    if (nivelesSubidos > 0) {
      const actualizado = await tx.usuario.update({
        where: { id: usuarioId },
        data: { availablePoints: { increment: puntosRegalo } },
        select: { availablePoints: true },
      });
      nuevoSaldoPuntos = actualizado.availablePoints;
    }

    if (companero) {
      if (companero.nivelVisto < nivelActual) {
        await tx.companero.update({
          where: { usuarioId },
          data: { nivelVisto: nivelActual },
        });
      }
    } else {
      await tx.companero.create({
        data: {
          usuarioId,
          nombre: "Compañero",
          personaje: null,
          nivelVisto: nivelActual,
        },
      });
    }

    return {
      reclamado: nivelesSubidos > 0,
      nivel: nivelActual,
      titulo: info.title,
      badgeUrl: badgeDeNivel(nivelActual),
      puntosRegalo: nivelesSubidos > 0 ? puntosRegalo : PUNTOS_SUBIR_NIVEL,
      nivelesSubidos,
      nuevoSaldoPuntos,
    };
  });
}
