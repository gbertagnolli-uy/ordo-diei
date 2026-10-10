import prisma from "@/lib/prisma";

export const esPadre = (rol?: string) => rol === "Padre" || rol === "Madre";

/**
 * Usuarios sobre los que actúa la petición: el propio por defecto;
 * otros miembros solo si quien pide es padre o madre. null = no autorizado.
 */
export async function usuariosObjetivo(
  session: { user: { id: number | string; rolFamiliar?: string } },
  pedidos?: unknown
): Promise<number[] | null> {
  const propio = Number(session.user.id);
  const ids = Array.isArray(pedidos) ? [...new Set(pedidos.map(Number).filter(Number.isInteger))] : [];
  if (ids.length === 0) return [propio];
  if (ids.every((id) => id === propio)) return [propio];
  if (!esPadre(session.user.rolFamiliar)) return null;
  const existentes = await prisma.usuario.count({ where: { id: { in: ids } } });
  return existentes === ids.length ? ids : null;
}
