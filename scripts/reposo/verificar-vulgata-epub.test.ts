import { test } from "node:test";
import assert from "node:assert/strict";
import { leerLibroEpub, normalizarLatin } from "./verificar-vulgata-epub.ts";

test("normalizarLatin: ignora tildes, puntuación, u/v, i/j y ligaduras", () => {
  assert.equal(normalizarLatin("Quæ vivit, Jesus!"), normalizarLatin("Quae uiuit Iesus"));
  assert.equal(normalizarLatin("cœli"), normalizarLatin("coeli"));
});

test("leerLibroEpub: capítulos y versículos, sin etiquetas", () => {
  const html = `<h2 id="a">Caput 1</h2><p><sup>1</sup> Beatus vir<span> </span>; <sup>2</sup> sed in lege.</p>
<h2 id="b">Caput 2</h2><p><sup>1</sup> Quare fremuerunt<span> </span>?</p>`;
  const l = leerLibroEpub(html);
  assert.equal(l.size, 2);
  assert.equal(l.get(1)?.get(1), "Beatus vir ;");
  assert.equal(l.get(1)?.get(2), "sed in lege.");
  assert.equal(l.get(2)?.get(1), "Quare fremuerunt ?");
});
