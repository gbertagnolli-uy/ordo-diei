import { test } from "node:test";
import assert from "node:assert/strict";
import { auditarBloque, informe } from "./auditar-es.ts";

test("auditarBloque: sin español", () => {
  assert.deepEqual(auditarBloque({ la: [{ t: "texto", v: "Deus in adjutórium" }], es: null, esFalta: true }), ["sin-es"]);
});

test("auditarBloque: líneas falta e inglés", () => {
  const p = auditarBloque({
    la: [{ t: "texto", v: "Dóminus vobíscum" }, { t: "texto", v: "Orémus" }],
    es: [{ t: "falta" }, { t: "texto", v: "The Lord be with you and with the spirit of the people" }],
  });
  assert.deepEqual(p, ["lineas-falta", "parece-ingles"]);
});

test("auditarBloque: español correcto no tiene problemas", () => {
  assert.deepEqual(auditarBloque({ la: [{ t: "texto", v: "Dóminus vobíscum" }], es: [{ t: "texto", v: "El Señor esté con vosotros" }] }), []);
});

test("informe: incluye la tabla de conteos", () => {
  const md = informe({ "sin-es": 2, "lineas-falta": 1, "parece-ingles": 0 }, 10, { "sin-es": [], "lineas-falta": [], "parece-ingles": [] });
  assert.match(md, /\| sin-es \| 2 \|/);
});
