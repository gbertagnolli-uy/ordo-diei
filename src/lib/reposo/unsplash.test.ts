import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aFotoPool, aFotoPublica, avisarDescarga, CONFIG_POR_DEFECTO, conUtm, MAX_PEDIDOS_POR_CORRIDA, orientacionDe,
  pedirAleatorias, refrescarPoolUnsplash, textoAtribucion, urlConTamano,
} from "./unsplash.ts";
import type { ConfigReposo, DepsUnsplash, FotoApi, FotoPool, RepoReposo } from "./unsplash.ts";

const foto = (id: string, w = 6000, h = 4000): FotoApi => ({
  id, width: w, height: h, color: "#112233", blur_hash: "LEHV6n",
  urls: { raw: `https://images.unsplash.com/photo-${id}?ixid=abc&ixlib=rb-4` },
  links: { html: `https://unsplash.com/photos/${id}`, download_location: `https://api.unsplash.com/photos/${id}/download?ixid=abc` },
  user: { name: "Ana Pérez", username: "ana_p" },
});

/** Repo en memoria con la misma semántica que el de Prisma. */
function repoMemoria(inicial: { config?: Partial<ConfigReposo>; fotos?: Partial<FotoPool>[] } = {}) {
  let config: ConfigReposo = { ...CONFIG_POR_DEFECTO, ...inicial.config };
  const fotos = new Map<string, FotoPool>();
  for (const f of inicial.fotos ?? []) {
    fotos.set(f.id!, { ...aFotoPool(foto(f.id!)), ...f });
  }
  const repo: RepoReposo = {
    async config() { return config; },
    async guardarConfig(c) { config = { ...config, ...c }; return config; },
    async idsExistentes() { return new Set(fotos.keys()); },
    async crearFotos(fs) { for (const f of fs) fotos.set(f.id, f); },
    async pendientesDeAviso() { return [...fotos.values()].filter((f) => !f.descargaAvisada && !f.oculta).map((f) => f.id); },
    async marcarAvisada(id) { fotos.get(id)!.descargaAvisada = true; },
    async activasPorAntiguedad() {
      return [...fotos.values()].filter((f) => f.activa && !f.oculta).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map((f) => ({ id: f.id }));
    },
    async desactivar(ids) { for (const id of ids) fotos.get(id)!.activa = false; },
  };
  return { repo, fotos, config: () => config };
}

type Llamada = { url: string; auth: string | null };
function fetchFalso(respuestas: { listados?: FotoApi[][]; descargaOk?: boolean; estado?: number }) {
  const llamadas: Llamada[] = [];
  let l = 0;
  const f: typeof fetch = async (input, init) => {
    const url = String(input);
    llamadas.push({ url, auth: (init?.headers as Record<string, string>)?.Authorization ?? null });
    if (respuestas.estado && respuestas.estado !== 200) return new Response("{}", { status: respuestas.estado });
    if (url.includes("/photos/random")) return Response.json(respuestas.listados?.[l++] ?? []);
    return new Response("{}", { status: respuestas.descargaOk === false ? 500 : 200 });
  };
  return { f, llamadas };
}
// `null` = sin clave (un parámetro `undefined` tomaría el valor por defecto)
const deps = (f: typeof fetch, accessKey: string | null = "KEY"): DepsUnsplash => ({ fetch: f, accessKey: accessKey ?? undefined });

test("orientacionDe y aFotoPool mapean la respuesta de la API", () => {
  assert.equal(orientacionDe({ width: 6000, height: 4000 }), "horizontal");
  assert.equal(orientacionDe({ width: 4000, height: 6000 }), "vertical");
  const p = aFotoPool(foto("a1"));
  assert.equal(p.autorNombre, "Ana Pérez");
  assert.equal(p.urlFoto, "https://unsplash.com/photos/a1");
  assert.equal(p.descargaAvisada, false);
  assert.equal(p.activa, true);
});

test("pedirAleatorias: usa el tema; con consulta propia usa query y no topics; cabeceras de la API", async () => {
  const { f, llamadas } = fetchFalso({ listados: [[foto("a")], [foto("b")]] });
  await pedirAleatorias(deps(f), { orientacion: "landscape", count: 30, tema: "6sMVjTLSkeQ", consulta: null });
  await pedirAleatorias(deps(f), { orientacion: "portrait", count: 10, tema: "6sMVjTLSkeQ", consulta: "  montañas  " });
  const u1 = new URL(llamadas[0].url);
  assert.equal(u1.searchParams.get("topics"), "6sMVjTLSkeQ");
  assert.equal(u1.searchParams.get("query"), null);
  assert.equal(u1.searchParams.get("orientation"), "landscape");
  assert.equal(u1.searchParams.get("count"), "30");
  assert.equal(u1.searchParams.get("content_filter"), "high");
  const u2 = new URL(llamadas[1].url);
  assert.equal(u2.searchParams.get("query"), "montañas");
  assert.equal(u2.searchParams.get("topics"), null);
  assert.equal(llamadas[0].auth, "Client-ID KEY");
});

test("pedirAleatorias sin clave o con error HTTP lanza", async () => {
  const { f } = fetchFalso({ estado: 403 });
  await assert.rejects(() => pedirAleatorias(deps(f), { orientacion: "landscape", count: 1, tema: "x", consulta: null }), /403/);
  await assert.rejects(() => pedirAleatorias(deps(f, null), { orientacion: "landscape", count: 1, tema: "x", consulta: null }), /UNSPLASH_ACCESS_KEY/);
});

test("refrescar: agrega solo las nuevas, avisa la descarga una vez por foto y guarda la sincronía", async () => {
  const { repo, fotos, config } = repoMemoria({ fotos: [{ id: "vieja", descargaAvisada: true }] });
  const { f, llamadas } = fetchFalso({ listados: [[foto("vieja"), foto("n1"), foto("n2"), foto("n1")], [foto("v1", 4000, 6000)]] });
  const r = await refrescarPoolUnsplash(repo, deps(f), new Date("2026-10-15T03:00:00Z"));
  assert.deepEqual(r, { ok: true, nuevas: 3, avisadas: 3, desactivadas: 0, activas: 4, pedidos: 5 });
  assert.equal(fotos.get("v1")!.orientacion, "vertical");
  assert.ok([...fotos.values()].every((x) => x.descargaAvisada));
  assert.equal(llamadas.filter((c) => c.url.includes("/download")).length, 3); // la «vieja» ya estaba avisada
  assert.equal(config().ultimaSincronia?.toISOString(), "2026-10-15T03:00:00.000Z");

  // segunda corrida con las mismas fotos: no vuelve a avisar ninguna
  const seg = fetchFalso({ listados: [[foto("n1")], []] });
  const r2 = await refrescarPoolUnsplash(repo, deps(seg.f));
  assert.equal(r2.ok && r2.nuevas, 0);
  assert.equal(seg.llamadas.filter((c) => c.url.includes("/download")).length, 0);
});

test("refrescar: una foto oculta o desactivada nunca vuelve a entrar", async () => {
  const { repo, fotos } = repoMemoria({ fotos: [{ id: "oculta", oculta: true, activa: false, descargaAvisada: true }, { id: "baja", activa: false, descargaAvisada: true }] });
  const { f } = fetchFalso({ listados: [[foto("oculta"), foto("baja"), foto("nueva")], []] });
  const r = await refrescarPoolUnsplash(repo, deps(f));
  assert.equal(r.ok && r.nuevas, 1);
  assert.equal(fotos.get("oculta")!.oculta, true);
  assert.equal(fotos.get("baja")!.activa, false);
});

test("refrescar: mantiene el pool en tamPool desactivando las más viejas", async () => {
  const base = new Date("2026-01-01T00:00:00Z").getTime();
  const { repo, fotos } = repoMemoria({
    config: { tamPool: 3 },
    fotos: [0, 1, 2].map((i) => ({ id: `p${i}`, descargaAvisada: true, createdAt: new Date(base + i * 1000) })),
  });
  const { f } = fetchFalso({ listados: [[foto("n1"), foto("n2")], []] });
  const r = await refrescarPoolUnsplash(repo, deps(f), new Date(base + 10_000));
  assert.deepEqual(r.ok && { d: r.desactivadas, a: r.activas }, { d: 2, a: 3 });
  assert.equal(fotos.get("p0")!.activa, false);
  assert.equal(fotos.get("p1")!.activa, false);
  assert.equal(fotos.get("p2")!.activa, true);
  assert.equal(fotos.get("n2")!.activa, true);
});

test("refrescar: si Unsplash falla o no hay clave, el pool queda como estaba", async () => {
  const { repo, fotos, config } = repoMemoria({ fotos: [{ id: "x", descargaAvisada: true }] });
  const mal = fetchFalso({ estado: 500 });
  const r = await refrescarPoolUnsplash(repo, deps(mal.f));
  assert.equal(r.ok, false);
  assert.equal(fotos.size, 1);
  assert.equal(config().ultimaSincronia, null);
  const sinClave = await refrescarPoolUnsplash(repo, deps(mal.f, null));
  assert.deepEqual(sinClave, { ok: false, motivo: "Falta UNSPLASH_ACCESS_KEY" });
});

test("refrescar: un aviso de descarga fallido se reintenta en la próxima corrida", async () => {
  const { repo, fotos } = repoMemoria();
  const a = fetchFalso({ listados: [[foto("n1")], []], descargaOk: false });
  const r = await refrescarPoolUnsplash(repo, deps(a.f));
  assert.equal(r.ok && r.avisadas, 0);
  assert.equal(fotos.get("n1")!.descargaAvisada, false);
  const b = fetchFalso({ listados: [[], []], descargaOk: true });
  const r2 = await refrescarPoolUnsplash(repo, deps(b.f));
  assert.equal(r2.ok && r2.avisadas, 1);
  assert.equal(fotos.get("n1")!.descargaAvisada, true);
});

test("refrescar: respeta el tope de pedidos por corrida (50/hora en modo demo)", async () => {
  const pendientes = Array.from({ length: 60 }, (_, i) => ({ id: `p${i}`, descargaAvisada: false }));
  const { repo } = repoMemoria({ fotos: pendientes });
  const { f, llamadas } = fetchFalso({ listados: [[], []] });
  const r = await refrescarPoolUnsplash(repo, deps(f));
  assert.equal(r.ok && r.pedidos, MAX_PEDIDOS_POR_CORRIDA);
  assert.equal(llamadas.length, MAX_PEDIDOS_POR_CORRIDA);
});

test("avisarDescarga llama a /photos/{id}/download con la clave", async () => {
  const { f, llamadas } = fetchFalso({});
  assert.equal(await avisarDescarga(deps(f), "abc"), true);
  assert.ok(llamadas[0].url.endsWith("/photos/abc/download"));
  assert.equal(await avisarDescarga(deps(f, null), "abc"), false);
});

test("URLs públicas: tamaño sin perder parámetros, UTM y atribución", () => {
  assert.equal(
    urlConTamano("https://images.unsplash.com/photo-1?ixid=abc&ixlib=rb-4", "horizontal"),
    "https://images.unsplash.com/photo-1?ixid=abc&ixlib=rb-4&w=1920&q=80&auto=format&fit=crop",
  );
  assert.match(urlConTamano("https://images.unsplash.com/photo-1", "vertical"), /w=1080/);
  assert.equal(conUtm("https://unsplash.com/@ana_p"), "https://unsplash.com/@ana_p?utm_source=ordo_diei&utm_medium=referral");
  const pub = aFotoPublica(aFotoPool(foto("a1")));
  assert.equal(pub.urlAutor, "https://unsplash.com/@ana_p?utm_source=ordo_diei&utm_medium=referral");
  assert.equal(pub.urlFoto, "https://unsplash.com/photos/a1?utm_source=ordo_diei&utm_medium=referral");
  assert.equal(textoAtribucion(pub), "Foto de Ana Pérez en Unsplash");
  assert.ok(!JSON.stringify(pub).includes("KEY"));
});
