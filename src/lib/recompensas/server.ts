// Premios reclamables (vault/HABITO_LIBRO.md D7–D9): se ganan, el usuario los reclama y un padre los entrega.
import prisma from "../prisma.ts";
import { esPadre } from "../habitos/permisos.ts";
import { NoAutorizadoError, NoEncontradoError } from "../habitos/server.ts";
import { leerItems, textoItem } from "../comportamiento/premios.ts";

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
  /** Vales: cuándo se arrancó el ticket (null = sin usar o no es un vale) */
  usadoEn: string | null;
  /** Premio sorpresa de comportamiento: sin abrir es true y no se revela el contenido */
  sorpresa: boolean;
  /** Qué incluye el premio sorpresa; null mientras no se abrió */
  contenido: string[] | null;
  usuario: { id: number; nombre: string; fotoUrl: string | null };
  entregadaPor: { id: number; nombre: string } | null;
};

const INCLUDE = {
  usuario: { select: { id: true, nombre: true, fotoUrl: true } },
  entregadaPor: { select: { id: true, nombre: true } },
} as const;

type Fila = Awaited<ReturnType<typeof prisma.recompensa.findMany<{ include: typeof INCLUDE }>>>[number];

const esSorpresa = (tipo: string) => tipo === "comportamiento" || tipo === "cofre" || tipo === "vale" || tipo === "reconocimiento";

const aVista = (r: Fila): RecompensaVista => ({
  id: r.id,
  tipo: r.tipo,
  // Un vale sin abrir no revela de qué es
  titulo:
    r.estado === "disponible" && r.tipo === "vale" ? "Vale sorpresa" : r.estado === "disponible" && r.tipo === "reconocimiento" ? "Reconocimiento" : r.titulo,
  origen: r.origen,
  estado: r.estado,
  pedido: r.pedido,
  ganadaEn: r.ganadaEn.toISOString(),
  reclamadaEn: r.reclamadaEn?.toISOString() ?? null,
  entregadaEn: r.entregadaEn?.toISOString() ?? null,
  usadoEn: r.usadoEn?.toISOString() ?? null,
  sorpresa: esSorpresa(r.tipo) && r.estado === "disponible",
  contenido:
    esSorpresa(r.tipo) && r.estado !== "disponible"
      ? // En el reconocimiento la virtud ya es el título: acá solo lo que suma
        leerItems(r.contenido).filter((i) => i.tipo !== "reconocimiento").map(textoItem)
      : null,
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
  if (esSorpresa(r.tipo)) throw new Error("Este premio sorpresa se abre desde «Mis premios»");

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

/** Premios sorpresa de comportamiento que el usuario todavía no abrió (banner del dashboard) */
export const contarSorpresasSinAbrir = (usuarioId: number) =>
  prisma.recompensa.count({ where: { usuarioId, tipo: { in: ["comportamiento", "cofre", "vale"] }, estado: "disponible" } });

/** Reconocimientos que el usuario todavía no reclamó (banner «Ganaste un reconocimiento») */
export const contarReconocimientosSinAbrir = (usuarioId: number) =>
  prisma.recompensa.count({ where: { usuarioId, tipo: "reconocimiento", estado: "disponible" } });
