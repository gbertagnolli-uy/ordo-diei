import { test } from "node:test";
import assert from "node:assert/strict";
import { construirLibro, parsearTextoDO } from "./textoLibro.ts";

test("marcadores de DO: versículo, responsorio, rúbrica, verso y macros", () => {
  const macros = new Map([["Per Dominum", "Per Dóminum nostrum Jesum Christum, Fílium tuum."]]);
  const segs = parsearTextoDO(
    "Orémus.\nV. Dóminus vobíscum.\nR. Et cum spíritu tuo.\n!Ad libitum\n92:1a Dóminus regnávit\n$Per Dominum\n_\n@Sancti/10-14:Oratio",
    macros,
  );
  assert.deepEqual(segs, [
    { t: "texto", v: "Orémus." },
    { t: "versiculo", v: "Dóminus vobíscum." },
    { t: "responsorio", v: "Et cum spíritu tuo." },
    { t: "rubrica", v: "Ad libitum" },
    { t: "verso", num: "92:1a", v: "Dóminus regnávit" },
    { t: "texto", v: "Per Dóminum nostrum Jesum Christum, Fílium tuum." },
  ]);
});

test("campos ;; de antífonas y rangos", () => {
  assert.deepEqual(parsearTextoDO("En la ley * del Señor;;1"), [{ t: "texto", v: "En la ley * del Señor" }]);
  assert.deepEqual(parsearTextoDO("S. Calixto, Papa y Mártir;;Duplex;;3;;vide C2b"), [
    { t: "texto", v: "S. Calixto, Papa y Mártir · Duplex · vide C2b" },
  ]);
});

test("libro: una sección española que cayó al latín queda «sin traducción» (D52)", () => {
  const r = construirLibro(
    { Officium: "S. Callisti Papæ et Martyris", Secreta: "Mýstica nobis, Dómine, prosit oblátio: quæ nos et a reátibus nostris expédiat." },
    { Officium: "S. Calixto, Papa y Mártir", Secreta: "Mýstica nobis, Dómine, prosit oblátio: quæ nos et a reátibus nostris expédiat." },
  );
  assert.ok(r);
  const [of, sec] = r.documento.secciones;
  assert.equal(of.clave, "officium");
  assert.equal(r.bloques.get(of.bloques[0])?.es?.[0].t, "texto");
  assert.equal(r.bloques.get(sec.bloques[0])?.es, null);
  assert.equal(r.bloques.get(sec.bloques[0])?.esFalta, true);
});

test("libro: archivo inexistente → null", () => {
  assert.equal(construirLibro(null, null), null);
});

import { construirMartirologio } from "./textoLibro.ts";

test("martirologio: una entrada por bloque, alineadas latín/español", () => {
  const r = construirMartirologio(
    { Titulus: "Idibus Octóbris", Martyrologium: "Albæ, in Hispánia, sanctæ Terésiæ Vírginis.\n\nRomæ, via Aurélia, sancti Fortunáti Mártyris.\n\n" },
    { Titulus: "15 de octubre", Martyrologium: "En Alba de España, santa Teresa, Virgen.\n\nEn Roma, en la vía Aurelia, san Fortunato, Mártir.\n\n" },
  );
  assert.ok(r);
  const [titulus, mart] = r.documento.secciones;
  assert.equal(titulus.clave, "titulus");
  assert.equal(mart.bloques.length, 2);
  assert.equal(r.bloques.get(mart.bloques[1])?.es?.[0].t, "texto");
});

test("martirologio: sin paridad entre columnas queda un solo bloque", () => {
  const r = construirMartirologio({ Martyrologium: "Uno.\n\nDos." }, { Martyrologium: "Uno." });
  assert.equal(r?.documento.secciones[0].bloques.length, 1);
});
