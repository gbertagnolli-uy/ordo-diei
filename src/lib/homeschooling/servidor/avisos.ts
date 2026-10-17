// Propio de Ordo (lane 174, Q3): avisos dentro de la app. Cuando un hijo comenta le llega a los padres; cuando un padre comenta
// le llega al hijo (o a los hijos) a quien concierne. Nada sale de la app: sin correo ni push.
import prisma from "../../prisma.ts";
import { NoAutorizadoError } from "../../habitos/server.ts";

export type Actor = { id: number; rol: string };
export type AvisoVista = { id: number; tipo: string; titulo: string; cuerpo: string | null; href: string | null; leido: boolean; creadoEn: string };

const resumen = (t: string) => (t.length > 120 ? `${t.slice(0, 117)}…` : t);

export async function avisarComentario(d: { autorId: number; autorNombre: string; autorEsPadre: boolean; alumnoIds: number[]; titulo: string; href: string; texto: string }): Promise<void> {
  // Un padre le avisa a los hijos del asunto; un hijo, a todos los padres
  const destinatarios = d.autorEsPadre
    ? [...new Set(d.alumnoIds)]
    : (await prisma.usuario.findMany({ where: { rolFamiliar: { in: ["Padre", "Madre"] } }, select: { id: true } })).map((u) => u.id);
  const ids = destinatarios.filter((id) => id !== d.autorId);
  if (ids.length === 0) return;
  // Uno por uno: si un destinatario ya no existe (se borró justo ahora) los demás igual reciben su aviso
  await Promise.allSettled(ids.map((usuarioId) => prisma.avisoEstudio.create({ data: { usuarioId, tipo: "comentario", titulo: `${d.autorNombre} comentó en «${d.titulo}»`, cuerpo: resumen(d.texto), href: d.href } })));
}

export async function misAvisos(a: Actor, limite = 30): Promise<{ avisos: AvisoVista[]; sinLeer: number }> {
  const [filas, sinLeer] = await Promise.all([
    prisma.avisoEstudio.findMany({ where: { usuarioId: a.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: limite }),
    prisma.avisoEstudio.count({ where: { usuarioId: a.id, leidoEn: null } }),
  ]);
  return { avisos: filas.map((f) => ({ id: f.id, tipo: f.tipo, titulo: f.titulo, cuerpo: f.cuerpo, href: f.href, leido: f.leidoEn !== null, creadoEn: f.createdAt.toISOString() })), sinLeer };
}

export async function marcarLeidos(a: Actor, ids?: number[]): Promise<number> {
  if (!a.id) throw new NoAutorizadoError("No autorizado");
  const r = await prisma.avisoEstudio.updateMany({ where: { usuarioId: a.id, leidoEn: null, ...(ids ? { id: { in: ids } } : {}) }, data: { leidoEn: new Date() } });
  return r.count;
}

export async function contarSinLeer(usuarioId: number): Promise<number> {
  return prisma.avisoEstudio.count({ where: { usuarioId, leidoEn: null } });
}
