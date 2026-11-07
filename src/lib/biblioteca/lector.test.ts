import { test } from "node:test";
import assert from "node:assert/strict";
import { aplanarIndice, cssLector, limitarTamano, porcentajeDeFraccion, TAMANO_INICIAL, zonaDeToque } from "./lector.ts";

test("zonaDeToque: tercio izquierdo, centro y tercio derecho", () => {
  assert.equal(zonaDeToque(0, 1000), "anterior");
  assert.equal(zonaDeToque(299, 1000), "anterior");
  assert.equal(zonaDeToque(300, 1000), "centro");
  assert.equal(zonaDeToque(500, 1000), "centro");
  assert.equal(zonaDeToque(700, 1000), "centro");
  assert.equal(zonaDeToque(701, 1000), "siguiente");
  assert.equal(zonaDeToque(999, 1000), "siguiente");
});

test("zonaDeToque: un ancho inválido cae en el centro (no rompe la lectura)", () => {
  assert.equal(zonaDeToque(100, 0), "centro");
  assert.equal(zonaDeToque(Number.NaN, 1000), "centro");
  assert.equal(zonaDeToque(100, Number.NaN), "centro");
});

test("limitarTamano: acota entre 14 y 26 y redondea", () => {
  assert.equal(limitarTamano(18.4), 18);
  assert.equal(limitarTamano(8), 14);
  assert.equal(limitarTamano(99), 26);
  assert.equal(limitarTamano(Number.NaN), TAMANO_INICIAL);
});

test("porcentajeDeFraccion: fracción 0–1 a 0–100 con un decimal", () => {
  assert.equal(porcentajeDeFraccion(0), 0);
  assert.equal(porcentajeDeFraccion(0.1234), 12.3);
  assert.equal(porcentajeDeFraccion(1), 100);
  assert.equal(porcentajeDeFraccion(1.4), 100);
  assert.equal(porcentajeDeFraccion(-1), 0);
  assert.equal(porcentajeDeFraccion(undefined), 0);
});

test("cssLector: tamaño, colores y reglas de lectura", () => {
  const css = cssLector(20, "sepia");
  assert.match(css, /font-size: 20px !important/);
  assert.match(css, /color: #5b4636 !important/);
  assert.match(css, /background: #f1e8d0 !important/);
  assert.match(css, /color-scheme: light/);
  assert.match(css, /text-align: justify/);
  assert.match(cssLector(20, "oscuro"), /color-scheme: dark/);
});

test("aplanarIndice: conserva href, etiqueta y nivel", () => {
  assert.deepEqual(
    aplanarIndice([
      { label: "Uno", href: "cap1.xhtml", subitems: [{ label: "Uno bis", href: "cap1.xhtml#b" }] },
      { href: "cap2.xhtml" },
      { label: "sin href" },
    ]),
    [
      { etiqueta: "Uno", href: "cap1.xhtml", nivel: 0 },
      { etiqueta: "Uno bis", href: "cap1.xhtml#b", nivel: 1 },
      { etiqueta: "cap2.xhtml", href: "cap2.xhtml", nivel: 0 },
    ],
  );
  assert.deepEqual(aplanarIndice(null), []);
});
