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

const normalizar = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Ids de los usuarios mencionados con `@Nombre` (sin distinguir mayúsculas ni tildes).
 * Gana el nombre más largo («@Juan Pablo» antes que «@Juan»), sin duplicados y sin el autor.
 */
export function extraerMenciones(texto: string, usuarios: { id: number; nombre: string }[], autorId: number): number[] {
  let resto = normalizar(texto);
  const ids: number[] = [];
  const porLargo = [...usuarios].sort((a, b) => b.nombre.length - a.nombre.length);
  for (const u of porLargo) {
    const nombre = normalizar(u.nombre).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`@${nombre}(?![\\p{L}\\p{N}_])`, "gu");
    if (!re.test(resto)) continue;
    resto = resto.replace(re, " ");
    if (u.id !== autorId && !ids.includes(u.id)) ids.push(u.id);
  }
  return ids;
}
