// Vales (vault/LANE_86_VALES.md): vouchers canjeables que llegan como premio sorpresa o familiar.
// Son una `Recompensa` de tipo «vale»: se abren con el regalo 3D (disponible → entregado) y después se
// «arrancan» para usarlos (`usadoEn`). Un padre puede revertirlo si se arrancó sin querer.
import type { Prisma } from "@prisma/client";
import prisma from "../prisma.ts";
import { esPadre } from "../habitos/permisos.ts";
import { NoAutorizadoError, NoEncontradoError } from "../habitos/server.ts";

type Cliente = Prisma.TransactionClient | typeof prisma;

export type ValeAdminVista = {
  id: number;
  texto: string;
  origen: string | null;
  abierto: boolean;
  usadoEn: string | null;
  ganadaEn: string;
  usuario: { id: number; nombre: string; fotoUrl: string | null };
};

/** Crea un vale sin abrir en «Mis premios» del usuario. `texto` es lo que sigue a «Vale por». */
export const crearVale = (cliente: Cliente, usuarioId: number, texto: string, origen: string) =>
  cliente.recompensa.create({
    data: { usuarioId, tipo: "vale", titulo: texto, origen, contenido: [{ tipo: "vale", texto }] },
  });

/** El dueño arranca el ticket: queda usado. Atómico, así que dos pestañas no lo usan dos veces. */
export async function usarVale(usuarioId: number, id: number) {
  const r = await prisma.recompensa.findUnique({ where: { id }, select: { tipo: true, usuarioId: true, estado: true } });
  if (!r || r.tipo !== "vale") throw new NoEncontradoError("Vale no encontrado");
  if (r.usuarioId !== usuarioId) throw new NoAutorizadoError("Solo podés usar tus propios vales");
  if (r.estado === "disponible") throw new Error("Primero abrí el premio");
  const res = await prisma.recompensa.updateMany({ where: { id, usadoEn: null }, data: { usadoEn: new Date() } });
  if (res.count === 0) throw new Error("Este vale ya se usó");
}

/** Un padre o madre deshace el uso (por ejemplo, si el ticket se arrancó sin querer) */
export async function restaurarVale(rol: string | undefined, id: number) {
  if (!esPadre(rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden restaurar vales");
  const r = await prisma.recompensa.findUnique({ where: { id }, select: { tipo: true } });
  if (!r || r.tipo !== "vale") throw new NoEncontradoError("Vale no encontrado");
  await prisma.recompensa.update({ where: { id }, data: { usadoEn: null } });
}

/** Todos los vales de la familia, para el panel de administración (solo padres) */
export async function listarVales(rol?: string): Promise<ValeAdminVista[]> {
  if (!esPadre(rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden ver los vales");
  const filas = await prisma.recompensa.findMany({
    where: { tipo: "vale" },
    include: { usuario: { select: { id: true, nombre: true, fotoUrl: true } } },
    orderBy: { ganadaEn: "desc" },
    take: 200,
  });
  return filas.map((r) => ({
    id: r.id,
    texto: r.titulo,
    origen: r.origen,
    abierto: r.estado !== "disponible",
    usadoEn: r.usadoEn?.toISOString() ?? null,
    ganadaEn: r.ganadaEn.toISOString(),
    usuario: r.usuario,
  }));
}

/**
 * Registra el resultado de un premio familiar para un usuario. Si el premio es un vale y lo ganó, la
 * entrega queda hecha y el vale llega sin abrir a «Mis premios»; el resto sigue su flujo de siempre.
 */
export async function crearEntregaPremio(premio: { id: number; titulo: string; esVale: boolean }, usuarioId: number, gano: boolean) {
  if (!(premio.esVale && gano)) {
    await prisma.premioEntregado.create({ data: { premioId: premio.id, usuarioId, estado: gano ? "Pendiente" : "No_ganado" } });
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.premioEntregado.create({ data: { premioId: premio.id, usuarioId, estado: "Entregado" } });
    await crearVale(tx, usuarioId, premio.titulo, "Premio familiar");
  });
}
