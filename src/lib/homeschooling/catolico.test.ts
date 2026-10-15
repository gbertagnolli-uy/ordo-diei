import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOGO_MEMORIA, ETIQUETA_CATEGORIA, itemDeCatalogo, pista, porCategoria } from "./catolico.ts";

test("el catálogo: claves únicas, textos completos y categorías conocidas", () => {
  const claves = CATALOGO_MEMORIA.map((i) => i.clave);
  assert.equal(new Set(claves).size, claves.length);
  for (const i of CATALOGO_MEMORIA) {
    assert.match(i.clave, /^[a-z0-9-]+$/, i.clave);
    assert.ok(i.titulo.length > 3 && i.texto.length > 20, i.clave);
    assert.ok(i.categoria in ETIQUETA_CATEGORIA, i.clave);
    assert.ok(i.desde >= 3 && i.desde <= 12, i.clave);
  }
});

test("las listas tienen la cantidad exacta de elementos", () => {
  const n = (clave: string) => itemDeCatalogo(clave)!.texto.split("\n").length;
  assert.deepEqual(
    ["mandamientos", "mandamientos-iglesia", "sacramentos", "virtudes-teologales", "virtudes-cardinales", "dones-espiritu-santo", "frutos-espiritu-santo", "pecados-capitales", "obras-misericordia-corporales", "obras-misericordia-espirituales", "misterios-gozosos", "misterios-luminosos", "misterios-dolorosos", "misterios-gloriosos"].map(n),
    [10, 5, 7, 3, 4, 7, 12, 7, 7, 7, 5, 5, 5, 5]
  );
});

test("las oraciones nombran lo que corresponde", () => {
  assert.match(itemDeCatalogo("padre-nuestro")!.texto, /líbranos del mal/);
  assert.match(itemDeCatalogo("ave-maria")!.texto, /hora de nuestra muerte/);
  assert.match(itemDeCatalogo("credo-apostolico")!.texto, /vida eterna/);
});

test("porCategoria cubre todo el catálogo y pista da las primeras palabras", () => {
  assert.equal(porCategoria().reduce((n, g) => n + g.items.length, 0), CATALOGO_MEMORIA.length);
  assert.equal(pista("Padre nuestro, que estás en el cielo\n1. Amarás a Dios sobre todo"), "Padre nuestro,…\nAmarás a…");
  assert.equal(itemDeCatalogo("no-existe"), null);
});
