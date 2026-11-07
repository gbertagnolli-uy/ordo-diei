// Nube de notas (lane 271) sobre Prisma: reemplaza a cloudCore de dovli (Firestore) con las mismas respuestas.
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { decidirPush, validarPedido, type ResultadoPush } from "./reglas";

export type FilaPull = { id: string; data: unknown | null; rev: number; purged: boolean };

export async function pullNotas(usuarioId: number, cursor: number, limite: number): Promise<FilaPull[]> {
  const filas = await prisma.notaPagina.findMany({
    where: { usuarioId, rev: { gt: Math.max(0, Math.floor(cursor) || 0) } },
    orderBy: { rev: "asc" },
    take: Math.min(Math.max(1, Math.floor(limite) || 100), 500),
  });
  return filas.map((f) => ({ id: f.id, data: f.datos, rev: f.rev, purged: f.purgada }));
}

export async function pushNota(usuarioId: number, body: unknown): Promise<ResultadoPush> {
  const pedido = validarPedido(body);
  return prisma.$transaction(async (tx) => {
    // Bloquea el contador del usuario (FOR UPDATE): dos pushes a la vez se ordenan y no se pisan
    await tx.notaEspacio.upsert({ where: { usuarioId }, create: { usuarioId, ultimaRev: 0 }, update: {} });
    await tx.$executeRaw`SELECT 1 FROM "Notas_Espacios" WHERE "Usuario_ID" = ${usuarioId} FOR UPDATE`;
    const actual = await tx.notaPagina.findUnique({ where: { usuarioId_id: { usuarioId, id: pedido.id } } });
    const decision = decidirPush(actual ? { rev: actual.rev, datos: actual.datos, purgada: actual.purgada } : null, pedido);
    if (!decision.guardar) return decision.respuesta;

    const { ultimaRev: rev } = await tx.notaEspacio.update({
      where: { usuarioId },
      data: { ultimaRev: { increment: 1 } },
    });
    // Borrada para siempre: se guarda JSON null (Prisma.DbNull) para que el resto de los dispositivos la borre
    const datos = pedido.purged ? Prisma.DbNull : (pedido.data as Prisma.InputJsonValue);
    await tx.notaPagina.upsert({
      where: { usuarioId_id: { usuarioId, id: pedido.id } },
      create: { usuarioId, id: pedido.id, rev, datos, purgada: pedido.purged },
      update: { rev, datos, purgada: pedido.purged },
    });
    return { ok: true, rev };
  });
}
