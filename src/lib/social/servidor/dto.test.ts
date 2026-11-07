import { test } from "node:test";
import assert from "node:assert/strict";
import { aCanalDTO, aNotificacionDTO, aPostDTO, aUsuarioDTO, resumirComentarios, resumirReacciones, type PostFila } from "./dto.ts";

const papa = { id: 1, nombre: "Papá Prueba", fotoUrl: "/api/archivos/p.webp", rolFamiliar: "Padre" };
const juan = { id: 3, nombre: "Juan Prueba", fotoUrl: null, rolFamiliar: "Hijo" };
const fecha = new Date("2026-11-07T12:00:00Z");

test("aUsuarioDTO: id y username de OpenCircle, padres = admin", () => {
  const u = aUsuarioDTO(papa);
  assert.equal(u.id, "1");
  assert.equal(u.username, "papa_prueba");
  assert.equal(u.name, "Papá Prueba");
  assert.equal(u.avatar_url, "/api/archivos/p.webp");
  assert.equal(u.role, "admin");
  assert.equal(aUsuarioDTO(juan).role, "user");
  assert.equal(aUsuarioDTO(juan).avatar_url, undefined);
});

test("aCanalDTO: un canal de materia sale privado", () => {
  const base = { id: "c1", emoji: "📚", nombre: "Historia", descripcion: null, slug: "historia", tipo: "publico" as const, materiaId: null, createdAt: fecha };
  assert.equal(aCanalDTO(base).type, "public");
  assert.equal(aCanalDTO({ ...base, materiaId: 7 }).type, "private");
  assert.equal(aCanalDTO({ ...base, tipo: "privado" }).type, "private");
  assert.equal(aCanalDTO(base).description, undefined);
});

test("resumirReacciones: agrupa por emoji en orden y marca las propias", () => {
  const r = resumirReacciones(
    [
      { usuarioId: 1, emoji: "👍" },
      { usuarioId: 3, emoji: "❤️" },
      { usuarioId: 3, emoji: "👍" },
    ],
    3,
  );
  assert.deepEqual(r, [
    { emoji: "👍", count: 2, me: true },
    { emoji: "❤️", count: 1, me: true },
  ]);
  assert.deepEqual(resumirReacciones([{ usuarioId: 1, emoji: "👍" }], 3), [{ emoji: "👍", count: 1, me: false }]);
});

test("resumirComentarios: nombres sin repetir y si comentó quien mira", () => {
  const c = resumirComentarios(
    [
      { autorId: 1, autor: { nombre: "Papá Prueba" } },
      { autorId: 3, autor: { nombre: "Juan Prueba" } },
      { autorId: 1, autor: { nombre: "Papá Prueba" } },
    ],
    3,
  );
  assert.deepEqual(c, { count: 3, names: ["Papá Prueba", "Juan Prueba"], me: true });
});

test("aPostDTO: comentario, contadores, medios y enlace al LMS", () => {
  const fila: PostFila = {
    id: "p2",
    contenido: "Muy bien @papa_prueba",
    autorId: 3,
    canalId: null,
    padreId: "p1",
    enlaceLms: { tipo: "leccion", id: 12, titulo: "Fracciones" },
    fijado: false,
    createdAt: fecha,
    updatedAt: fecha,
    autor: juan,
    canal: null,
    medios: [{ id: "m1", url: "/api/archivos/f.webp", autorId: 3, createdAt: fecha }],
    reacciones: [{ usuarioId: 1, emoji: "👍" }],
    respuestas: [],
  };
  const p = aPostDTO(fila, 1);
  assert.equal(p.type, "comment");
  assert.equal(p.parent_id, "p1");
  assert.equal(p.channel_id, undefined);
  assert.equal(p.user.username, "juan_prueba");
  assert.equal(p.reaction_count, 1);
  assert.equal(p.has_reacted, true);
  assert.deepEqual(p.reactions.user_reaction_ids, ["👍"]);
  assert.equal(p.comment_count, 0);
  assert.deepEqual(p.medias[0], { id: "m1", url: "/api/archivos/f.webp", post_id: "p2", user_id: "3", created_at: fecha.toISOString(), updated_at: fecha.toISOString() });
  assert.deepEqual(p.enlace_lms, { tipo: "leccion", id: 12, titulo: "Fracciones" });
  assert.equal(aPostDTO({ ...fila, enlaceLms: { tipo: "otro" } }, 1).enlace_lms, null);
  assert.equal(aPostDTO({ ...fila, padreId: null }, 3).type, "post");
  assert.equal(aPostDTO(fila, 3).has_reacted, false);
});

test("aNotificacionDTO: tipos de OpenCircle y post original de una respuesta", () => {
  const n = aNotificacionDTO({
    id: "n1",
    destinoId: 1,
    origenId: 3,
    tipo: "respuesta",
    postId: "p2",
    leida: false,
    createdAt: fecha,
    destino: papa,
    origen: juan,
    post: { contenido: "x".repeat(250), padreId: "p1" },
  });
  assert.equal(n.type, "reply");
  assert.equal(n.recipient_id, "1");
  assert.equal(n.sender.username, "juan_prueba");
  assert.deepEqual(n.data, { content: "x".repeat(200), post_id: "p2", original_post_id: "p1" });
  const m = aNotificacionDTO({ id: "n2", destinoId: 1, origenId: 3, tipo: "mencion", postId: "p1", leida: true, createdAt: fecha, destino: papa, origen: juan, post: { contenido: "hola", padreId: null } });
  assert.equal(m.type, "mention");
  assert.equal(m.data?.original_post_id, "p1");
  assert.equal(m.is_read, true);
});
