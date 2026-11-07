// Reglas del módulo Social (lane 276, D6): quién ve un canal y quién edita, borra o fija un post.
// Sin acceso a la base: el servidor (src/lib/social/servidor/*) trae los datos y pregunta acá.
import { esPadre } from "../habitos/permisos.ts";

export type Actor = { id: number; rol?: string };

/** Público: todos. Privado o de una materia: sus miembros y los padres. */
export function puedeVerCanal(
  canal: { tipo: "publico" | "privado"; materiaId: number | null },
  actor: Actor,
  miembrosIds: number[],
): boolean {
  if (canal.tipo === "publico" && canal.materiaId === null) return true;
  return esPadre(actor.rol) || miembrosIds.includes(actor.id);
}

/** Solo el autor edita su post o comentario. */
export function puedeEditarPost(post: { autorId: number }, actor: Actor): boolean {
  return post.autorId === actor.id;
}

/** El autor, o un padre (moderación). */
export function puedeBorrarPost(post: { autorId: number }, actor: Actor): boolean {
  return post.autorId === actor.id || esPadre(actor.rol);
}

/** Solo los padres fijan posts. */
export function puedeFijar(actor: Actor): boolean {
  return esPadre(actor.rol);
}

/** El «username» de OpenCircle para un integrante de Ordo (D12): «Ana Prueba» → «ana_prueba». */
export function usernameDe(nombre: string): string {
  const u = nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return u || "usuario";
}

/**
 * Ids de los usuarios mencionados con `@username` (como en OpenCircle: `@(\w+)`, D12), en el orden en que
 * aparecen, sin duplicados y sin el autor. Si dos integrantes tienen el mismo username, gana el de id menor.
 */
export function extraerMenciones(texto: string, usuarios: { id: number; nombre: string }[], autorId: number): number[] {
  const porUsername = new Map<string, number>();
  for (const u of [...usuarios].sort((a, b) => a.id - b.id)) {
    const clave = usernameDe(u.nombre);
    if (!porUsername.has(clave)) porUsername.set(clave, u.id);
  }
  const ids: number[] = [];
  for (const m of texto.matchAll(/@(\w+)/g)) {
    const id = porUsername.get(m[1].toLowerCase());
    if (id !== undefined && id !== autorId && !ids.includes(id)) ids.push(id);
  }
  return ids;
}
