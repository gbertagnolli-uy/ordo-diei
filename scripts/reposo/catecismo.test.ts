import { test } from "node:test";
import assert from "node:assert/strict";
import { parsearCatecismo } from "./catecismo.ts";
import { corregir, limpiarPregunta } from "./catecismo-ocr.ts";

const MUESTRA = `ÍNDICE

LECCIÓN PRELIMINAR

1. - ¿Sois cristiano? - Sí, señor; soy cristiano por la gracia de Dios.

2. - ¿ Por qué decís por la gracia de Dios? - Digo por la gracia de Dios
porque el ser cristiano es un don gratuito.

PARTE PRIMERA

DEL SÍMBOLO DE LOS APÓSTOLES LLAMADO
VULGARMENTE EL «CREDO»

CAPITULO PRIMERO
DEL CREDO EN GENERAL

3. - ¿Cuál es la primera parte de la doctrina cristiana? - La primera
parte es el símbolo de los Apóstoles.

4. - ¿Por qué llamáis al Credo SÍMBOLO DE LOS APÓSTOLES?

Llamo símbolo de los Apóstoles al Credo porque es un compendio.

5. - ¿Cuántos son los artículos? - Son doce. 6. ¿Quién los enseñó? - Los Apóstoles.

BREVE HISTORIA DE LA RELIGIÓN

7. - ¿Esto ya no entra? - No.
`;

test("catecismo: numeración, parte, capítulo, pregunta y respuesta", () => {
  const q = parsearCatecismo(MUESTRA);
  assert.deepEqual(q.map((x) => x.n), [1, 2, 3, 4, 5, 6]);
  assert.equal(q[0].pregunta, "¿Sois cristiano?");
  assert.equal(q[0].respuesta, "Sí, señor; soy cristiano por la gracia de Dios.");
  assert.equal(q[0].parte, "Lección preliminar");
  assert.equal(q[1].pregunta, "¿Por qué decís por la gracia de Dios?");
  assert.match(q[2].parte, /^Parte primera · Del Símbolo de los Apóstoles/);
  assert.equal(q[2].capitulo, "Capítulo I · Del Credo en general");
});

test("catecismo: la respuesta puede ir en otro párrafo y varias preguntas pueden venir pegadas", () => {
  const q = parsearCatecismo(MUESTRA);
  assert.equal(q[3].respuesta, "Llamo símbolo de los Apóstoles al Credo porque es un compendio.");
  assert.equal(q[4].respuesta, "Son doce.");
  assert.equal(q[5].pregunta, "¿Quién los enseñó?");
});

test("catecismo: lo que viene después de «Breve historia» no entra", () => {
  assert.ok(!parsearCatecismo(MUESTRA).some((x) => x.n === 7));
});

test("ocr: correcciones seguras", () => {
  assert.equal(corregir("¿Que quiere decir?"), "¿Qué quiere decir?");
  assert.equal(corregir("¿Por que Dios no impide el pecado?"), "¿Por qué Dios no impide el pecado?");
  assert.equal(corregir("Permanecieron fíeles. Él confía en nosotros"), "Permanecieron fieles. Él confía en nosotros");
  assert.equal(corregir("fundada por El, y sólo El es"), "fundada por Él, y sólo Él es");
  assert.equal(corregir("Si, señor; es verdad."), "Sí, señor; es verdad.");
  assert.equal(corregir("Dios lo impide. 2°.- De los Angeles"), "Dios lo impide.");
  assert.equal(corregir("Primero, 1 o. Creo; 2 o. Espero"), "Primero, 1.º Creo; 2.º Espero");
});

test("ocr: una pregunta con palabras irrecuperables se descarta", () => {
  const ok = { n: 1, parte: "p", capitulo: "c", pregunta: "¿Sois cristiano?", respuesta: "Sí, señor." };
  assert.ok(limpiarPregunta(ok));
  assert.equal(limpiarPregunta({ ...ok, respuesta: "El Señor es destmir el cormpción" }), null);
  assert.equal(limpiarPregunta({ ...ok, respuesta: "Texto con | barra" }), null);
});
