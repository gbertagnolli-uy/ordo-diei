// Pruebas de los datos generados (SPEC idle-marco-fotos §6.3). Solo leen los JSON del repo: no necesitan las fuentes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type Cita = { id: string; libro: string; capitulo: number; desde: number; hasta: number; la: string; es: string; ref: string };
type Pregunta = { n: number; parte: string; capitulo: string; pregunta: string; respuesta: string };

const leer = <T,>(n: string) => JSON.parse(readFileSync(fileURLToPath(new URL(n, import.meta.url)), "utf8")) as T;
const citas = leer<Cita[]>("./citas-biblicas.json");
const catecismo = leer<Pregunta[]>("./catecismo-pio-x.json");

test("hay al menos 365 citas bíblicas, una por pasaje (D51)", () => {
  assert.ok(citas.length >= 365, `solo ${citas.length}`);
  assert.equal(new Set(citas.map((c) => c.id)).size, citas.length);
});

test("cada cita tiene latín y español, dentro de los largos del reposo (§4.3)", () => {
  for (const c of citas) {
    assert.ok(c.la.length > 10 && c.es.length > 10, c.id);
    assert.ok(c.la.length <= 220, `${c.id}: latín ${c.la.length}`);
    assert.ok(c.es.length <= 300, `${c.id}: español ${c.es.length}`);
    assert.match(c.la, /[.?!;:]$/, c.id);
    assert.match(c.es, /[.?!»]$/, c.id);
  }
});

test("la referencia es coherente con libro, capítulo y versículos", () => {
  for (const c of citas) {
    assert.ok(c.hasta >= c.desde && c.capitulo >= 1 && c.desde >= 1, c.id);
    const rango = c.hasta !== c.desde ? `${c.desde}-${c.hasta}` : `${c.desde}`;
    assert.ok(c.ref.endsWith(` ${c.capitulo}, ${rango}`), `${c.id}: ${c.ref}`);
    assert.equal(c.id, `${c.libro}-${c.capitulo}-${c.desde}${c.hasta !== c.desde ? `-${c.hasta}` : ""}`);
  }
});

test("salmos: la numeración es la de la Vulgata (Salmo 22 = «Dominus regit me»), no la hebrea", () => {
  const s22 = citas.find((c) => c.id === "Ps-22-1-2");
  assert.ok(s22);
  assert.ok(s22.la.startsWith("Dominus regit me"));
  assert.ok(s22.es.startsWith("El Señor me pastorea"));
  assert.equal(s22.ref, "Salmo 22, 1-2");
  const s50 = citas.find((c) => c.id === "Ps-50-3");
  assert.ok(s50?.la.startsWith("Miserere mei, Deus"));
  assert.ok(s50?.es.startsWith("Ten piedad de mí, oh Dios"));
  const s117 = citas.find((c) => c.id === "Ps-117-24");
  assert.ok(s117?.la.startsWith("Hæc est dies quam fecit Dominus"));
});

test("el español no es inglés ni tiene restos del OCR", () => {
  const ingles = new Set(["the", "and", "of", "with", "shall", "thou", "unto"]);
  for (const c of citas) {
    const palabras = c.es.toLowerCase().match(/\p{L}+/gu) ?? [];
    assert.ok(!palabras.some((w) => ingles.has(w)), c.id);
    assert.ok(!/[€^°■\\|_*~<>{}\[\]@#£•]/.test(c.es), `${c.id}: símbolo del OCR`);
    assert.ok(!/\d/.test(c.es), `${c.id}: dígito suelto (llamada de nota)`);
    assert.ok(!/[ \t]{2,}/.test(c.es) && !/\s[,;:.]/.test(c.es), `${c.id}: espacios`);
  }
});

test("el latín no conserva el carácter de control que dejó la ligadura œ", () => {
  for (const c of citas) assert.ok(!/[\u0080-\u009f]/.test(c.la), c.id);
});

test("catecismo completo y ≥ 300 preguntas entran en los límites del reposo (§4.3)", () => {
  assert.ok(catecismo.length >= 600, `solo ${catecismo.length}`);
  const caben = catecismo.filter((p) => p.pregunta.length <= 140 && p.respuesta.length <= 360);
  assert.ok(caben.length >= 300, `solo ${caben.length}`);
  assert.equal(new Set(catecismo.map((p) => p.n)).size, catecismo.length);
  const p1 = catecismo.find((p) => p.n === 1);
  assert.equal(p1?.pregunta, "¿Sois cristiano?");
  assert.equal(p1?.respuesta, "Sí, señor; soy cristiano por la gracia de Dios.");
});

test("catecismo: toda pregunta es una pregunta y ninguna respuesta tiene restos del OCR", () => {
  for (const p of catecismo) {
    assert.ok(p.pregunta.startsWith("¿") || p.pregunta.endsWith("?"), `n.º ${p.n}`);
    assert.ok(p.respuesta.length >= 8, `n.º ${p.n}`);
    assert.ok(!/[|_~^*{}\\]/.test(p.pregunta + p.respuesta), `n.º ${p.n}: símbolo del OCR`);
  }
});
