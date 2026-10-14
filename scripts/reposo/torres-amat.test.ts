import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SEP_CUERPO,
  afinidad,
  alinearCapitulos,
  cortarCapitulos,
  limpiarVersiculo,
  parrafosDeVersiculos,
} from "./torres-amat.ts";

test("limpiarVersiculo: llamadas de nota, guiones de renglón y comillas sueltas", () => {
  assert.equal(limpiarVersiculo("Bienaventurados los pobres de espíritu 11 : porque de ellos es el reino"), "Bienaventurados los pobres de espíritu: porque de ellos es el reino");
  assert.equal(limpiarVersiculo("Bienaventurados los que tienen hambre y sed de la justicia 14 * : porque"), "Bienaventurados los que tienen hambre y sed de la justicia: porque");
  assert.equal(limpiarVersiculo("el sepul¬ cro de los pa¬ triarcas"), "el sepulcro de los patriarcas");
  assert.equal(limpiarVersiculo("' Los cielos publican la gloria"), "Los cielos publican la gloria");
  assert.equal(limpiarVersiculo("la verdad9; diéronse un ósculo"), "la verdad; diéronse un ósculo");
  assert.equal(limpiarVersiculo("descansará con la esperanza u."), "descansará con la esperanza.");
});

test("párrafos: un versículo por párrafo; el título del salmo lleva su cuerpo aparte", () => {
  const v = parrafosDeVersiculos([
    "SALMO XXII",
    "",
    "1. Salmo de David.",
    "",
    "El Señor me pastorea, nada me faltará.",
    "",
    "2. Él me ha colocado en lugar de pastos:",
    "me ha conducido junto a unas aguas.",
    "",
    "11 Véase Pastor.",
  ]);
  assert.deepEqual(v.map((x) => x.n), [1, 2]);
  assert.equal(v[0].cuerpo, "El Señor me pastorea, nada me faltará.");
  assert.equal(v[1].texto, "Él me ha colocado en lugar de pastos: me ha conducido junto a unas aguas.");
});

test("capítulos: uno nuevo cada vez que la numeración deja de crecer (también sin el «1.»)", () => {
  const caps = cortarCapitulos([1, 2, 3, 1, 2, 2, 3, 4].map((n) => ({ n, texto: `v${n}` })));
  assert.deepEqual(caps.map((c) => [...c.keys()]), [[1, 2, 3], [1, 2], [2, 3, 4]]);
  const conTitulo = cortarCapitulos([{ n: 1, texto: "Salmo de David.", cuerpo: "El Señor me pastorea." }]);
  assert.equal(conTitulo[0].get(1), `Salmo de David.${SEP_CUERPO}El Señor me pastorea.`);
});

test("alineación: sobran segmentos (notas) y falta el último versículo", () => {
  const cap = (n: number) => new Map(Array.from({ length: n }, (_, i) => [i + 1, `texto ${i + 1}`] as [number, string]));
  const detectados = [cap(2), cap(5), cap(8), cap(7), cap(4)]; // 2 = nota numerada; 7 = capítulo de 8 al que le falta el último
  const al = alinearCapitulos(detectados, [5, 8, 8, 4]);
  assert.deepEqual([...al.keys()], [1, 2, 3, 4]);
  assert.equal(al.get(3)?.size, 7);
});

test("alineación: si falta un capítulo y hay dos con igual cantidad de versículos, desempata la afinidad léxica", () => {
  // el OCR perdió el capítulo 21 (Hosanna…): el detectado es el 22, pero ambos tienen 2 versículos
  const detectados = [new Map<number, string>([[1, "a"], [2, "Los fariseos y los saduceos le preguntaron sobre el tributo a César en Jerusalem"]])];
  const latin = ["Hosanna filio David Jerusalem templum", "pharisæi sadducæi tributum Cæsari Jerusalem"];
  const al = alinearCapitulos(detectados, [2, 2], latin);
  assert.deepEqual([...al.keys()], [2]);
  assert.ok(afinidad("Jerusalem y el templo", "templum Jerusalem") > 0);
});
