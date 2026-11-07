// Forma de los datos que espera el front de OpenCircle (lane 276, D11): la de
// vendor/opencircle/packages/core/src/services/routers/*/types.ts (devscalelabs/opencircle@5a8beada),
// en snake_case y sin envoltorio. Acá se pasa de los modelos de Ordo a esa forma.
import { esPadre } from "../../habitos/permisos.ts";
import { usernameDe } from "../permisos.ts";

export type UserDTO = {
  id: string;
  name?: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  role: "admin" | "user";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type ChannelDTO = {
  id: string;
  name: string;
  description?: string;
  slug: string;
  type: "public" | "private";
  emoji: string;
  created_at: string;
  updated_at: string;
};

export type MediaDTO = { id: string; url: string; post_id: string; user_id: string; created_at: string; updated_at: string };

export type PostDTO = {
  id: string;
  content: string;
  type: "post" | "comment";
  is_pinned: boolean;
  user_id: string;
  channel_id?: string;
  parent_id?: string;
  user: UserDTO;
  channel?: ChannelDTO;
  medias: MediaDTO[];
  comment_count: number;
  reaction_count: number;
  reactions: { summary: { emoji: string; count: number; me: boolean }[]; user_reaction_ids: string[] };
  comment_summary: { count: number; names: string[]; me: boolean };
  has_reacted: boolean;
  enlace_lms?: { tipo: "curso" | "leccion"; id: number; titulo: string } | null;
  created_at: string;
  updated_at: string;
};

export type NotificationDTO = {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: "mention" | "like" | "reply";
  data?: { content: string; post_id?: string; original_post_id?: string };
  is_read: boolean;
  recipient: UserDTO;
  sender: UserDTO;
  created_at: string;
  updated_at: string;
};

export type UsuarioFila = { id: number; nombre: string; fotoUrl: string | null; rolFamiliar: string; createdAt?: Date };
export const usuarioSelect = { id: true, nombre: true, fotoUrl: true, rolFamiliar: true } as const;

const iso = (d: Date | null | undefined) => (d ?? new Date(0)).toISOString();

export function aUsuarioDTO(u: UsuarioFila): UserDTO {
  return {
    id: String(u.id),
    name: u.nombre,
    username: usernameDe(u.nombre),
    email: "",
    avatar_url: u.fotoUrl ?? undefined,
    role: esPadre(u.rolFamiliar) ? "admin" : "user",
    is_active: true,
    is_verified: true,
    created_at: iso(u.createdAt),
    updated_at: iso(u.createdAt),
  };
}

export type CanalFila = {
  id: string;
  emoji: string;
  nombre: string;
  descripcion: string | null;
  slug: string;
  tipo: "publico" | "privado";
  materiaId: number | null;
  createdAt: Date;
};

export function aCanalDTO(c: CanalFila): ChannelDTO {
  return {
    id: c.id,
    name: c.nombre,
    description: c.descripcion ?? undefined,
    slug: c.slug,
    type: c.tipo === "privado" || c.materiaId !== null ? "private" : "public",
    emoji: c.emoji,
    created_at: iso(c.createdAt),
    updated_at: iso(c.createdAt),
  };
}

export type PostFila = {
  id: string;
  contenido: string;
  autorId: number;
  canalId: string | null;
  padreId: string | null;
  enlaceLms: unknown;
  fijado: boolean;
  createdAt: Date;
  updatedAt: Date;
  autor: UsuarioFila;
  canal: CanalFila | null;
  medios: { id: string; url: string; autorId: number; createdAt: Date }[];
  reacciones: { usuarioId: number; emoji: string }[];
  respuestas: { autorId: number; autor: { nombre: string } }[];
};

/** Reacciones agrupadas por emoji, en el orden en que apareció cada uno. */
export function resumirReacciones(reacciones: { usuarioId: number; emoji: string }[], yo: number) {
  const summary: { emoji: string; count: number; me: boolean }[] = [];
  for (const r of reacciones) {
    let item = summary.find((s) => s.emoji === r.emoji);
    if (!item) summary.push((item = { emoji: r.emoji, count: 0, me: false }));
    item.count += 1;
    if (r.usuarioId === yo) item.me = true;
  }
  return summary;
}

/** Quiénes comentaron (sin repetir, en orden) y si comentó quien mira. */
export function resumirComentarios(respuestas: { autorId: number; autor: { nombre: string } }[], yo: number) {
  const names: string[] = [];
  for (const r of respuestas) if (!names.includes(r.autor.nombre)) names.push(r.autor.nombre);
  return { count: respuestas.length, names, me: respuestas.some((r) => r.autorId === yo) };
}

function enlaceValido(v: unknown): PostDTO["enlace_lms"] {
  if (!v || typeof v !== "object") return null;
  const e = v as { tipo?: unknown; id?: unknown; titulo?: unknown };
  if ((e.tipo === "curso" || e.tipo === "leccion") && Number.isInteger(e.id) && typeof e.titulo === "string")
    return { tipo: e.tipo, id: e.id as number, titulo: e.titulo };
  return null;
}

export function aPostDTO(p: PostFila, yo: number): PostDTO {
  const summary = resumirReacciones(p.reacciones, yo);
  return {
    id: p.id,
    content: p.contenido,
    type: p.padreId ? "comment" : "post",
    is_pinned: p.fijado,
    user_id: String(p.autorId),
    channel_id: p.canalId ?? undefined,
    parent_id: p.padreId ?? undefined,
    user: aUsuarioDTO(p.autor),
    channel: p.canal ? aCanalDTO(p.canal) : undefined,
    medias: p.medios.map((m) => ({
      id: m.id,
      url: m.url,
      post_id: p.id,
      user_id: String(m.autorId),
      created_at: iso(m.createdAt),
      updated_at: iso(m.createdAt),
    })),
    comment_count: p.respuestas.length,
    reaction_count: p.reacciones.length,
    reactions: { summary, user_reaction_ids: p.reacciones.filter((r) => r.usuarioId === yo).map((r) => r.emoji) },
    comment_summary: resumirComentarios(p.respuestas, yo),
    has_reacted: summary.some((s) => s.me),
    enlace_lms: enlaceValido(p.enlaceLms),
    created_at: iso(p.createdAt),
    updated_at: iso(p.updatedAt),
  };
}

const TIPO_NOTIFICACION = { mencion: "mention", reaccion: "like", respuesta: "reply" } as const;

export type NotificacionFila = {
  id: string;
  destinoId: number;
  origenId: number;
  tipo: keyof typeof TIPO_NOTIFICACION;
  postId: string | null;
  leida: boolean;
  createdAt: Date;
  destino: UsuarioFila;
  origen: UsuarioFila;
  post: { contenido: string; padreId: string | null } | null;
};

export function aNotificacionDTO(n: NotificacionFila): NotificationDTO {
  return {
    id: n.id,
    recipient_id: String(n.destinoId),
    sender_id: String(n.origenId),
    type: TIPO_NOTIFICACION[n.tipo],
    data: n.post
      ? { content: n.post.contenido.slice(0, 200), post_id: n.postId ?? undefined, original_post_id: n.post.padreId ?? n.postId ?? undefined }
      : undefined,
    is_read: n.leida,
    recipient: aUsuarioDTO(n.destino),
    sender: aUsuarioDTO(n.origen),
    created_at: iso(n.createdAt),
    updated_at: iso(n.createdAt),
  };
}
