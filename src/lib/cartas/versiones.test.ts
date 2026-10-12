// node --test src/lib/cartas/versiones.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { gradoMaximoReal, listarVersiones, tieneVersionesDistintas } from "./versiones.ts";

test("listarVersiones: marca actual, alcanzado y bloqueado, sin rutas de arte", () => {
  const v = listarVersiones("san-jose", 2);
  assert.deepEqual(v.map((x) => x.estado), ["alcanzado", "actual", "bloqueado", "bloqueado"]);
  assert.deepEqual(v.map((x) => x.grado), [1, 2, 3, 4]);
  for (const x of v) assert.match(x.url, /^\/api\/cartas\/san-jose\/version\?grado=[1-4]&e=(real|silueta)$/);
  assert.equal(v[1].url.endsWith("e=real"), true);
  assert.equal(v[2].url.endsWith("e=silueta"), true);
});

test("listarVersiones: carta bloqueada → todo bloqueado y el grado I se ve real en B/N", () => {
  const v = listarVersiones("san-jose", 0);
  assert.deepEqual(v.map((x) => x.estado), ["bloqueado", "bloqueado", "bloqueado", "bloqueado"]);
  assert.equal(v[0].url.endsWith("e=real"), true);
  assert.equal(v[1].url.endsWith("e=silueta"), true);
  assert.equal(gradoMaximoReal(0), 1);
});

test("tieneVersionesDistintas: una sola imagen no necesita carrusel", () => {
  assert.equal(tieneVersionesDistintas({ imagenUrl: "/a.webp" }), false);
  assert.equal(tieneVersionesDistintas({ imagenUrl: "/a.webp", imagenGrado3Url: "/c.webp" }), true);
});
