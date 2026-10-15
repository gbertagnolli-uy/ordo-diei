import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contraste, mezclar } from "./contraste.ts";

// Contraste AA (4,5) de los textos que usan «Hoy aprendo» y el resto de Estudio, en los dos temas.
// Los colores salen de los tokens reales de globals.css (si cambian, este test lo avisa).
const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const bloque = (ini: string, fin: string) => css.slice(css.indexOf(ini), css.indexOf(fin, css.indexOf(ini) + 1));
const leer = (txt: string) => Object.fromEntries([...txt.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
const claro = leer(bloque(":root {", "\n.dark {"));
const temas: Record<string, Record<string, string>> = { claro, oscuro: { ...claro, ...leer(bloque("\n.dark {", "@theme inline")) } };

const SOBRE_TARJETA = ["foreground", "muted-foreground", "primary", "success", "warning", "destructive"];

for (const [nombre, t] of Object.entries(temas)) {
  test(`AA en el tema ${nombre}: textos sobre la tarjeta y el fondo`, () => {
    for (const k of SOBRE_TARJETA) assert.ok(contraste(t[k], t.card) >= 4.5, `${k} sobre card: ${contraste(t[k], t.card).toFixed(2)}`);
    assert.ok(contraste(t["foreground"], t.background) >= 4.5);
    assert.ok(contraste(t["muted-foreground"], t.background) >= 4.5);
    assert.ok(contraste(t["primary-foreground"], t.primary) >= 4.5, "botón primario");
  });

  test(`AA en el tema ${nombre}: texto de color sobre su tinte al 10 % (primary, success, warning)`, () => {
    for (const k of ["primary", "success", "warning"]) {
      const fondo = mezclar(t[k], t.card, 0.1);
      assert.ok(contraste(t[k], fondo) >= 4.5, `${k} sobre ${k}/10: ${contraste(t[k], fondo).toFixed(2)}`);
    }
  });

  test(`AA en el tema ${nombre}: texto normal sobre el tinte de destructive (los avisos usan foreground, no destructive)`, () => {
    // text-destructive sobre bg-destructive/10 no llega a 4,5 en el tema oscuro: por eso esos avisos usan text-foreground
    assert.ok(contraste(t["foreground"], mezclar(t["destructive"], t.card, 0.15)) >= 4.5);
  });
}

test("contraste: valores conocidos", () => {
  assert.equal(Math.round(contraste("#000000", "#ffffff")), 21);
  assert.equal(contraste("#ffffff", "#ffffff"), 1);
});
