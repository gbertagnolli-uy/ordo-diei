// Prueba de la API Social (lane 276, fase 2) contra la base local. node i276api.mjs <puerto>
import { request } from "playwright";
const base = `http://localhost:${process.argv[2]}`;
let fallas = 0;
const ok = (cond, msg) => {
  if (!cond) fallas++;
  console.log(cond ? "OK  " : "FALLA", msg);
};
async function como(userId) {
  const r = await request.newContext({ baseURL: base });
  const l = await r.post("/api/auth/login", { data: { userId, pinSecreto: "1234" } });
  if (!l.ok()) throw new Error(`login ${userId}: ${l.status()}`);
  return r;
}
const papa = await como(1);
const mama = await como(2);
const juan = await como(3);
const ana = await como(4);
const ID = Date.now();
const S = "/api/social";

// Usuarios (menciones y perfil)
const fam = await (await juan.get(`${S}/users?query=ana`)).json();
ok(fam.length === 1 && fam[0].username === "ana_prueba" && fam[0].role === "user", `buscar «ana» → ana_prueba (${fam.map((u) => u.username)})`);
const perfil = await (await juan.get(`${S}/users/username/papa_prueba`)).json();
ok(perfil.id === "1" && perfil.role === "admin" && perfil.name === "Papá Prueba", "perfil por username");
ok((await juan.get(`${S}/users/username/nadie`)).status() === 404, "username inexistente → 404");

// Canales
ok((await juan.post(`${S}/channels`, { data: { name: "x" } })).status() === 403, "un hijo no crea canales");
const pub = await papa.post(`${S}/channels`, { data: { name: `General ${ID}`, emoji: "💬" } });
const canalPub = await pub.json();
ok(pub.status() === 201 && canalPub.type === "public" && canalPub.slug === `general-${ID}`, `el padre crea un canal público (${canalPub.slug})`);
const priv = await (await papa.post(`${S}/channels`, { data: { name: `Grandes ${ID}`, type: "private", member_ids: [3] } })).json();
ok(priv.type === "private", "el padre crea un canal privado con Juan");
ok((await papa.post(`${S}/channels`, { data: { name: `General ${ID}` } })).status() === 400, "no se repite la dirección del canal");
const deAna = (await (await ana.get(`${S}/channels`)).json()).map((c) => c.id);
const deJuan = (await (await juan.get(`${S}/channels`)).json()).map((c) => c.id);
ok(deAna.includes(canalPub.id) && !deAna.includes(priv.id), "Ana ve el público y no el privado");
ok(deJuan.includes(priv.id), "Juan (miembro) ve el privado");
ok((await (await mama.get(`${S}/channels`)).json()).some((c) => c.id === priv.id), "Mamá (padre) ve el privado");
ok((await ana.get(`${S}/channels/${priv.id}`)).status() === 403, "Ana no abre el privado → 403");
const miembros = await (await papa.get(`${S}/channel-members?channel_id=${priv.id}`)).json();
ok(miembros.map((m) => m.user_id).sort().join() === "1,3", `miembros del privado: Papá y Juan (${miembros.map((m) => m.user_id)})`);

// Posts y menciones
const cr = await juan.post(`${S}/posts`, { data: { content: `Hola @ana_prueba y @papa_prueba ${ID}`, channel_id: canalPub.id } });
const post = await cr.json();
ok(cr.status() === 201 && post.user.username === "juan_prueba" && post.channel?.id === canalPub.id && post.type === "post", "Juan publica en el canal público");
ok((await ana.post(`${S}/posts`, { data: { content: "x", channel_id: priv.id } })).status() === 403, "Ana no publica en el privado");
ok((await juan.post(`${S}/posts`, { data: { content: "   " } })).status() === 400, "post vacío → 400");
const notAna = await (await ana.get(`${S}/notifications`)).json();
const menc = notAna.find((n) => n.data?.post_id === post.id);
ok(menc?.type === "mention" && menc.sender.username === "juan_prueba" && menc.is_read === false, "Ana recibe la mención");
ok((await (await papa.get(`${S}/notifications`)).json()).some((n) => n.data?.post_id === post.id && n.type === "mention"), "Papá recibe la mención");
const noLeidas = (await (await ana.get(`${S}/notifications/no-leidas`)).json()).count;
ok(noLeidas >= 1, `contador de no leídas de Ana (${noLeidas})`);
const leida = await (await ana.post(`${S}/notifications/${menc.id}/read`)).json();
ok(leida.is_read === true && (await (await ana.get(`${S}/notifications/no-leidas`)).json()).count === noLeidas - 1, "marcar leída baja el contador");
ok((await juan.post(`${S}/notifications/${menc.id}/read`)).status() === 404, "Juan no marca la notificación de Ana");

// Comentarios
const com = await (await ana.post(`${S}/posts`, { data: { content: "¡Buenísimo!", parent_id: post.id } })).json();
ok(com.type === "comment" && com.parent_id === post.id && com.channel_id === canalPub.id, "Ana comenta (el comentario hereda el canal)");
ok((await (await juan.get(`${S}/notifications`)).json()).some((n) => n.type === "reply" && n.data?.post_id === com.id && n.data?.original_post_id === post.id), "Juan recibe la respuesta");
const hilo = await (await juan.get(`${S}/posts?parent_id=${post.id}`)).json();
ok(hilo.length === 1 && hilo[0].id === com.id, "el hilo trae el comentario");
const conResumen = await (await juan.get(`${S}/posts/${post.id}`)).json();
ok(conResumen.comment_count === 1 && conResumen.comment_summary.names[0] === "Ana Prueba", "el post resume los comentarios");

// Reacciones
const r1 = await (await ana.post(`${S}/reactions`, { data: { post_id: post.id, emoji: "👍" } })).json();
ok(r1.emoji === "👍" && r1.user.username === "ana_prueba", "Ana reacciona 👍");
await papa.post(`${S}/reactions`, { data: { post_id: post.id, emoji: "👍" } });
const visto = await (await ana.get(`${S}/posts/${post.id}`)).json();
ok(visto.reaction_count === 2 && visto.reactions.summary[0].count === 2 && visto.reactions.summary[0].me && visto.has_reacted, "resumen de reacciones con «me»");
ok((await (await juan.get(`${S}/notifications`)).json()).some((n) => n.type === "like" && n.data?.post_id === post.id), "Juan recibe el aviso de la reacción");
const grupos = await (await juan.get(`${S}/reactions/${post.id}`)).json();
ok(grupos.length === 1 && grupos[0].count === 2 && grupos[0].users.length === 2, "reacciones agrupadas por emoji");
const r2 = await (await ana.post(`${S}/reactions`, { data: { post_id: post.id, emoji: "👍" } })).json();
ok(r2.message === "Reacción quitada", "repetir la reacción la quita");
ok((await ana.delete(`${S}/reactions?post_id=${post.id}&emoji=${encodeURIComponent("👍")}`)).status() === 404, "quitar una que ya no está → 404");
ok((await papa.delete(`${S}/reactions?post_id=${post.id}&emoji=${encodeURIComponent("👍")}`)).ok(), "Papá quita la suya");

// Timeline y filtros
const privPost = await (await juan.post(`${S}/posts`, { data: { content: `Secreto ${ID}`, channel_id: priv.id } })).json();
const tlAna = (await (await ana.get(`${S}/posts?limit=100`)).json()).map((p) => p.id);
ok(tlAna.includes(post.id) && !tlAna.includes(privPost.id) && !tlAna.includes(com.id), "timeline de Ana: sin el privado y sin comentarios");
ok((await (await juan.get(`${S}/posts?limit=100`)).json()).some((p) => p.id === privPost.id), "timeline de Juan: con el privado");
ok((await ana.get(`${S}/posts?channel_slug=${priv.slug}`)).status() === 403, "Ana no lista el canal privado");
ok((await ana.get(`${S}/posts/${privPost.id}`)).status() === 403, "Ana no abre un post del privado");
const porCanal = await (await ana.get(`${S}/posts?channel_slug=${canalPub.slug}`)).json();
ok(porCanal.length === 1 && porCanal[0].id === post.id, "filtrar por canal");
const deJuanPosts = await (await ana.get(`${S}/posts?user_id=3&limit=100`)).json();
ok(deJuanPosts.every((p) => p.user_id === "3") && deJuanPosts.some((p) => p.id === post.id), "filtrar por autor (perfil)");
const pag = await (await juan.get(`${S}/posts?skip=0&limit=1`)).json();
ok(pag.length === 1, "limit");

// Editar, fijar, borrar (D6)
ok((await ana.put(`${S}/posts/${post.id}`, { data: { content: "hackeado" } })).status() === 403, "Ana no edita el post de Juan");
const ed = await (await juan.put(`${S}/posts/${post.id}`, { data: { content: `Editado ${ID}` } })).json();
ok(ed.content === `Editado ${ID}`, "Juan edita el suyo");
ok((await juan.put(`${S}/posts/${post.id}`, { data: { is_pinned: true } })).status() === 403, "un hijo no fija");
const fij = await (await mama.put(`${S}/posts/${post.id}`, { data: { is_pinned: true } })).json();
ok(fij.is_pinned === true, "Mamá fija el post");
const primero = (await (await ana.get(`${S}/posts?limit=5`)).json())[0];
ok(primero?.id === post.id, "el fijado va primero en el timeline");
ok((await juan.delete(`${S}/posts/${com.id}`)).status() === 403, "Juan no borra el comentario de Ana");
ok((await papa.delete(`${S}/posts/${com.id}`)).ok(), "Papá borra el comentario de Ana (moderación)");
ok((await (await juan.get(`${S}/posts/${post.id}`)).json()).comment_count === 0, "el comentario borrado no cuenta");
ok((await juan.delete(`${S}/posts/${post.id}`)).ok(), "Juan borra su post");
ok((await juan.get(`${S}/posts/${post.id}`)).status() === 404, "post borrado → 404");
ok((await juan.get(`${S}/posts/no-es-uuid`)).status() === 404, "id que no es uuid → 404");

// Post con foto
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const wf = await juan.post(`${S}/posts/with-files`, {
  multipart: { post: JSON.stringify({ content: `Con foto ${ID}` }), files: { name: "f.png", mimeType: "image/png", buffer: png } },
});
const conFoto = await wf.json();
ok(wf.status() === 201 && conFoto.medias.length === 1 && /^\/api\/archivos\//.test(conFoto.medias[0].url), `post con foto (${wf.status()} ${conFoto.medias?.[0]?.url ?? conFoto.error})`);
const vid = await juan.post(`${S}/posts/with-files`, {
  multipart: { post: JSON.stringify({ content: "video" }), files: { name: "v.mp4", mimeType: "video/mp4", buffer: Buffer.from("x") } },
});
ok(vid.status() === 400, "video → 400 hasta la lane 277");
await juan.delete(`${S}/posts/${conFoto.id}`);
await juan.delete(`${S}/posts/${privPost.id}`);

// Canales: editar y borrar
ok((await juan.put(`${S}/channels/${canalPub.id}`, { data: { name: "x" } })).status() === 403, "un hijo no edita canales");
ok((await (await papa.put(`${S}/channels/${canalPub.id}`, { data: { description: "Para todos" } })).json()).description === "Para todos", "el padre edita la descripción");
ok((await papa.post(`${S}/channel-members?channel_id=${priv.id}&user_id=4`)).status() === 201, "el padre suma a Ana al privado");
ok((await ana.get(`${S}/channels/${priv.id}`)).ok(), "Ana ya ve el privado");
ok((await papa.delete(`${S}/channel-members?channel_id=${priv.id}&user_id=4`)).ok(), "el padre la quita");
ok((await papa.delete(`${S}/channels/${canalPub.id}`)).ok() && (await papa.delete(`${S}/channels/${priv.id}`)).ok(), "el padre borra los canales");
ok(!(await (await papa.get(`${S}/channels`)).json()).some((c) => c.id === canalPub.id), "el canal borrado no se lista");

const anon = await request.newContext({ baseURL: base });
ok((await anon.get(`${S}/posts`)).status() === 401, "sin sesión → 401");
console.log(fallas ? `${fallas} FALLAS` : "TODO OK");
