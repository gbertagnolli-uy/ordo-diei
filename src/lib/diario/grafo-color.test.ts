import { test } from "node:test";
import assert from "node:assert/strict";
import { aHsl, atenuar, atenuarArista, colorCss, colorDeCategoria, colorPorFecha, conLuminosidad, desdeHsl, leerColor, mezclar, type Rgba } from "./grafo-color.ts";

test("leerColor: hexadecimal corto y largo", () => {
  assert.deepEqual(leerColor("#502300"), [80, 35, 0, 1]);
  assert.deepEqual(leerColor("#FFF"), [255, 255, 255, 1]);
  assert.deepEqual(leerColor("  #c4956a "), [196, 149, 106, 1]);
});

test("leerColor: rgb() y rgba() con comas o espacios, con y sin opacidad", () => {
  assert.deepEqual(leerColor("rgb(80, 35, 0)"), [80, 35, 0, 1]);
  assert.deepEqual(leerColor("rgba(80, 35, 0, 0.5)"), [80, 35, 0, 0.5]);
  assert.deepEqual(leerColor("rgb(80 35 0 / 0.25)"), [80, 35, 0, 0.25]);
  assert.deepEqual(leerColor("rgb(100% 0% 50% / 50%)"), [255, 0, 128, 0.5]);
});

test("leerColor: color(srgb …) que devuelve el navegador para color-mix", () => {
  assert.deepEqual(leerColor("color(srgb 1 0 0.5 / 0.18)"), [255, 0, 128, 0.18]);
  assert.deepEqual(leerColor("color(srgb 0.2 0.4 0.6)"), [51, 102, 153, 1]);
  assert.equal(leerColor("color(display-p3 1 0 0)"), null);
});

test("leerColor: lo que no es un color da null", () => {
  assert.equal(leerColor(""), null);
  assert.equal(leerColor("rojo"), null);
  assert.equal(leerColor("rgb(a, b, c)"), null);
  assert.equal(leerColor("#12"), null);
});

test("HSL: ida y vuelta de colores conocidos", () => {
  for (const c of [[255, 0, 0, 1], [0, 255, 0, 1], [0, 0, 255, 1], [196, 149, 106, 1], [128, 128, 128, 1], [0, 0, 0, 1], [255, 255, 255, 1]] as Rgba[]) {
    const [h, s, l] = aHsl(c);
    const vuelta = desdeHsl(h, s, l);
    c.slice(0, 3).forEach((v, i) => assert.ok(Math.abs(v - vuelta[i]) <= 1, `${c} → ${vuelta}`));
  }
  assert.deepEqual(aHsl([255, 0, 0, 1]), [0, 1, 0.5]);
});

test("conLuminosidad: cambia solo la luminosidad y conserva la opacidad", () => {
  const base: Rgba = [196, 149, 106, 0.7];
  const claro = conLuminosidad(base, 0.8);
  const oscuro = conLuminosidad(base, 0.2);
  assert.ok(aHsl(claro)[2] > aHsl(base)[2] && aHsl(oscuro)[2] < aHsl(base)[2]);
  assert.equal(claro[3], 0.7);
  assert.ok(Math.abs(aHsl(claro)[0] - aHsl(base)[0]) < 2);
});

test("colorPorFecha: con tema oscuro lo nuevo es más claro; con tema claro, más oscuro", () => {
  const base: Rgba = [196, 149, 106, 1];
  assert.ok(aHsl(colorPorFecha(base, 1, true))[2] > aHsl(colorPorFecha(base, 0, true))[2]);
  assert.ok(aHsl(colorPorFecha(base, 1, false))[2] < aHsl(colorPorFecha(base, 0, false))[2]);
  assert.ok(Math.abs(aHsl(colorPorFecha(base, 0, true))[2] - 0.42) < 0.01);
  assert.ok(Math.abs(aHsl(colorPorFecha(base, 1, false))[2] - 0.42) < 0.01);
});

test("colorDeCategoria: usa el color elegido; sin él, uno estable y distinto por categoría", () => {
  assert.deepEqual(colorDeCategoria("#42a5f5", 3), [66, 165, 245, 1]);
  assert.deepEqual(colorDeCategoria(null, 3), colorDeCategoria(undefined, 3));
  assert.deepEqual(colorDeCategoria("no es color", 3), colorDeCategoria(null, 3));
  assert.notDeepEqual(colorDeCategoria(null, 1), colorDeCategoria(null, 2));
});

test("atenuar y mezclar", () => {
  assert.equal(atenuar([1, 2, 3, 1], true)[3], 0.22);
  assert.equal(atenuar([1, 2, 3, 1], false)[3], 0.2);
  assert.equal(atenuarArista([0, 0, 0, 0.16])[3], 0.045);
  assert.equal(atenuarArista([0, 0, 0, 0.8])[3], 0.2);
  assert.deepEqual(mezclar([0, 0, 0, 1], [100, 200, 50, 0], 0.5), [50, 100, 25, 0.5]);
  assert.deepEqual(mezclar([10, 20, 30, 1], [90, 80, 70, 1], 0), [10, 20, 30, 1]);
});

test("colorCss: texto válido para el lienzo", () => {
  assert.equal(colorCss([1, 2, 3, 0.5]), "rgba(1,2,3,0.5)");
  assert.equal(colorCss([1, 2, 3, 1], 2), "rgba(1,2,3,1)");
  assert.equal(colorCss([1, 2, 3, 1], -1), "rgba(1,2,3,0)");
});
