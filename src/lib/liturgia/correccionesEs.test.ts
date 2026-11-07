import { test } from "node:test";
import assert from "node:assert/strict";
import { aplicarCorreccion } from "./correccionesEs.ts";

const bloque = { la: [{ t: "texto" as const, v: "Dóminus vobíscum" }], es: null, esFalta: true };

test("sin corrección devuelve el mismo bloque", () => {
  assert.equal(aplicarCorreccion("abc", bloque, {}), bloque);
});

test("con corrección reemplaza el español y apaga esFalta", () => {
  const r = aplicarCorreccion("abc", bloque, { abc: [{ t: "texto", v: "El Señor esté con vosotros" }] });
  assert.deepEqual(r.es, [{ t: "texto", v: "El Señor esté con vosotros" }]);
  assert.equal(r.esFalta, false);
  assert.deepEqual(r.la, bloque.la);
});
