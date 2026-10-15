import { test } from "node:test";
import assert from "node:assert/strict";
import { acentuarInterrogativo, armarCatecismoPdf, prepararTextoPdf } from "./catecismo-pdf.ts";

const MUESTRA = `Catecismo de San Pío X
 Salve Maria Regina

                                      LECCIÓN PRELIMINAR
1.- ¿Sois cristiano? - Sí, señor; soy cristiano por la gracia de Dios.

3.- ¿Quién es verdadero cristiano? - Verdadero cristiano es el que cree y profesa la doc-
trina cristiana.

                                                       2
                                   PARTE PRIMERA
                             DEL SÍMBOLO DE LOS APÓSTOLES

                                          CAPÍTULO I
                                   DEL CREDO EN GENERAL

5.- ¿Que quiere decir CREO? - Tengo por cierto
lo que Dios reveló.

6.- Decidlos. - 1º. Creo en Dios Padre. 2º. Creo en Jesucristo.

                                       1 °- De las virtudes teologales
7.- Traedme un ejemplo. Un ejemplo es este.

                                                       3
INDICE
8.- ¿Esto ya no entra? - No.
`;

test("pdf: quita portada, números de página, subtítulos e índice, y une las palabras partidas", () => {
  const t = prepararTextoPdf(MUESTRA);
  assert.ok(!t.includes("Salve Maria Regina"));
  assert.ok(!/^\s*\d{1,3}\s*$/m.test(t));
  assert.ok(!t.includes("De las virtudes teologales"));
  assert.ok(t.includes("la doctrina cristiana."));
  assert.ok(!t.includes("Esto ya no entra"));
});

test("pdf: preguntas con y sin signo, parte y capítulo", () => {
  const q = armarCatecismoPdf(MUESTRA);
  assert.deepEqual(q.map((x) => x.n), [1, 3, 5, 6, 7]);
  assert.equal(q[1].respuesta, "Verdadero cristiano es el que cree y profesa la doctrina cristiana.");
  assert.equal(q[2].pregunta, "¿Qué quiere decir CREO?");
  assert.equal(q[2].capitulo, "Capítulo I · Del Credo en general");
  assert.equal(q[3].pregunta, "Decidlos.");
  assert.equal(q[3].respuesta, "1º. Creo en Dios Padre. 2º. Creo en Jesucristo.");
  assert.equal(q[4].pregunta, "Traedme un ejemplo.");
  assert.equal(q[4].respuesta, "Un ejemplo es este.");
});

test("pdf: interrogativos sin tilde", () => {
  assert.equal(acentuarInterrogativo("¿Quien es?"), "¿Quién es?");
  assert.equal(acentuarInterrogativo("¿Como se reza?"), "¿Cómo se reza?");
  assert.equal(acentuarInterrogativo("¿Qué es?"), "¿Qué es?");
});
