// Premios reclamables (vault/HABITO_LIBRO.md D7–D9): se ganan, el usuario los reclama y un padre los entrega.
import prisma from "../prisma.ts";
import { esPadre } from "../habitos/permisos.ts";
import { NoAutorizadoError, NoEncontradoError } from "../habitos/server.ts";

export type EstadoRecompensa = "disponible" | "reclamado" | "entregado";

export type RecompensaVista = {
  id: number;
  tipo: string;
  titulo: string;
  origen: string | null;
  estado: EstadoRecompensa;
  pedido: string | null;
  ganadaEn: string;
  reclamadaEn: string | null;
  entregadaEn: string | null;
  usuario: { id: number; nombre: string; fotoUrl: string | null };
  entregadaPor: { id: number; nombre: string } | null;
};

const INCLUDE = {
  usuario: { select: { id: true, nombre: true, fotoUrl: true } },
  entregadaPor: { select: { id: true, nombre: true } },
} as const;

type Fila = Awaited<ReturnType<typeof prisma.recompensa.findMany<{ include: typeof INCLUDE }>>>[number];

const aVista = (r: Fila): RecompensaVista => ({
  id: r.id,
  tipo: r.tipo,
  titulo: r.titulo,
  origen: r.origen,
  estado: r.estado,
  pedido: r.pedido,
  ganadaEn: r.ganadaEn.toISOString(),
  reclamadaEn: r.reclamadaEn?.toISOString() ?? null,
  entregadaEn: r.entregadaEn?.toISOString() ?? null,
  usuario: r.usuario,
  entregadaPor: r.entregadaPor,
});

/** Los premios propios y, para padres, los reclamos de la familia que esperan entrega */
export async function getRecompensas(usuarioId: number, rol?: string) {
  const [propias, porEntregar] = await Promise.all([
    prisma.recompensa.findMany({
      where: { usuarioId },
      include: INCLUDE,
      orderBy: { ganadaEn: "desc" },
    }),
    esPadre(rol)
      ? prisma.recompensa.findMany({
          where: { estado: "reclamado" },
          include: INCLUDE,
          orderBy: { reclamadaEn: "asc" },
        })
      : Promise.resolve([]),
  ]);
  return { propias: propias.map(aVista), porEntregar: porEntregar.map(aVista) };
}

/** Insignia de la barra lateral: premios por reclamar y, para padres, reclamos por entregar */
export async function contarRecompensasPendientes(usuarioId: number, rol?: string) {
  const [porReclamar, porEntregar] = await Promise.all([
    prisma.recompensa.count({ where: { usuarioId, estado: "disponible" } }),
    esPadre(rol) ? prisma.recompensa.count({ where: { estado: "reclamado" } }) : Promise.resolve(0),
  ]);
  return porReclamar + porEntregar;
}

/** El dueño reclama su premio; el de libro exige decir qué libro quiere */
export async function reclamarRecompensa(usuarioId: number, id: number, pedido?: unknown) {
  const r = await prisma.recompensa.findUnique({ where: { id } });
  if (!r) throw new NoEncontradoError("Premio no encontrado");
  if (r.usuarioId !== usuarioId) throw new NoAutorizadoError("Solo podés reclamar tus propios premios");
  if (r.estado !== "disponible") throw new Error("Este premio ya fue reclamado");

  const texto = typeof pedido === "string" ? pedido.trim() : "";
  if (r.tipo === "libro" && !texto) throw new Error("Escribí qué libro querés");
  if (texto.length > 200) throw new Error("El pedido no puede superar los 200 caracteres");

  await prisma.recompensa.update({
    where: { id },
    data: { estado: "reclamado", pedido: texto || null, reclamadaEn: new Date() },
  });
}

/** Un padre o madre marca como entregado un premio reclamado */
export async function entregarRecompensa(actor: { id: number; rol?: string }, id: number) {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden entregar premios");
  const r = await prisma.recompensa.findUnique({ where: { id } });
  if (!r) throw new NoEncontradoError("Premio no encontrado");
  if (r.estado !== "reclamado") throw new Error("El premio todavía no fue reclamado o ya se entregó");

  await prisma.recompensa.update({
    where: { id },
    data: { estado: "entregado", entregadaEn: new Date(), entregadaPorId: actor.id },
  });
}
