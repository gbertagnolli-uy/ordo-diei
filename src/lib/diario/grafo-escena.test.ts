import { test } from "node:test";
import assert from "node:assert/strict";
import type { DatosGrafo, NodoGrafo } from "./grafo.ts";
import {
  AJUSTES_GRAFO,
  construirEscena,
  direccionesDesdeCentro,
  disposicionRadial,
  esVecino,
  gradoDe,
  gradosDirigidos,
  gravedad,
  longitudResorte,
  radioColision,
  radioDeNodo,
  radioNucleoElegido,
  repulsion,
  sembrarPorCapas,
} from "./grafo-escena.ts";

/** Un grafo de prueba: `n` nodos, enlaces `[a, b]`, y de manera opcional el centro y los saltos de cada nodo. */
function grafo(n: number, aristas: [number, number][], centro?: number, profundidades?: (number | undefined)[]): DatosGrafo {
  const nodos: NodoGrafo[] = Array.from({ length: n }, (_, i) => ({ indice: i, id: i + 1, titulo: `N${i}`, fecha: "2026-01-01", hora: null, categoriaId: null, vista: null, profundidad: profundidades?.[i] }));
  return { nodos, aristas: aristas.flat(), centro };
}

test("escena: la adyacencia no repite vecinos (A→B y B→A cuentan una vez) y da los grados", () => {
  const e = construirEscena(grafo(4, [[0, 1], [1, 0], [1, 2]]));
  assert.equal(gradoDe(e, 0), 1);
  assert.equal(gradoDe(e, 1), 2);
  assert.equal(gradoDe(e, 2), 1);
  assert.equal(gradoDe(e, 3), 0);
  assert.equal(e.aristasNoDirigidas.length / 2, 2);
  assert.ok(esVecino(e, 0, 1));
  assert.ok(!esVecino(e, 0, 2));
});

test("escena: los enlaces a uno mismo y los fuera de rango se ignoran", () => {
  const e = construirEscena(grafo(2, [[0, 0], [0, 1], [0, 5], [-1, 1]]));
  assert.equal(e.aristasNoDirigidas.length / 2, 1);
  assert.equal(gradoDe(e, 0), 1);
});

test("escena: sin nodos no falla", () => {
  const e = construirEscena({ nodos: [], aristas: [] });
  assert.equal(e.radios.length, 0);
  assert.equal(e.ordenEtiquetas.length, 0);
  assert.equal(sembrarPorCapas(e, 63).length, 0);
});

test("escena: los nodos de más enlaces son más grandes y el centro tiene su radio propio", () => {
  const estrella = Array.from({ length: 29 }, (_, i): [number, number] => [0, i + 1]);
  const e = construirEscena(grafo(30, estrella));
  assert.ok(e.radios[0] > e.radios[1]);
  assert.ok(e.radios.every((r) => r >= AJUSTES_GRAFO.radioNodoMin && r <= AJUSTES_GRAFO.radioNodoMax + 1e-6));
  const c = construirEscena(grafo(5, [[0, 1], [0, 2], [3, 0]], 3));
  assert.equal(c.radios[3], AJUSTES_GRAFO.radioCentro);
  assert.equal(c.ordenEtiquetas[0], 3);
});

test("escena: el orden de etiquetas va por grado y, a igual grado, por índice", () => {
  const e = construirEscena(grafo(5, [[2, 0], [2, 1], [2, 3], [3, 4]]));
  assert.deepEqual(Array.from(e.ordenEtiquetas), [2, 3, 0, 1, 4]);
});

test("medidas: el centro es más grande que el resto pero no más del doble que el mínimo; el núcleo del elegido entra dentro del anillo", () => {
  assert.ok(AJUSTES_GRAFO.radioNodoMin < AJUSTES_GRAFO.radioNodoMax);
  assert.ok(AJUSTES_GRAFO.radioCentro > AJUSTES_GRAFO.radioNodoMax);
  assert.ok(AJUSTES_GRAFO.radioCentro / AJUSTES_GRAFO.radioNodoMin <= 2);
  for (const r of [AJUSTES_GRAFO.radioNodoMin, AJUSTES_GRAFO.radioNodoMax, AJUSTES_GRAFO.radioCentro]) {
    const nucleo = radioNucleoElegido(r);
    assert.ok(nucleo > 0);
    assert.ok(nucleo < r - AJUSTES_GRAFO.anilloElegidoAncho);
    assert.ok(nucleo >= r * AJUSTES_GRAFO.nucleoElegidoMinRazon);
  }
  assert.equal(radioDeNodo(1, 1), AJUSTES_GRAFO.radioNodoMin);
  assert.equal(radioDeNodo(1, 10), AJUSTES_GRAFO.radioNodoMin);
  assert.equal(radioDeNodo(10, 10), AJUSTES_GRAFO.radioNodoMax);
  assert.equal(radioDeNodo(99, 10), AJUSTES_GRAFO.radioNodoMax);
});

test("densidad: dispersa separa más y densa junta más", () => {
  assert.ok(longitudResorte("dispersa") > longitudResorte("normal") && longitudResorte("normal") > longitudResorte("densa"));
  assert.ok(radioColision("dispersa") > radioColision("normal") && radioColision("normal") > radioColision("densa"));
  assert.ok(gravedad("dispersa") < gravedad("normal") && gravedad("normal") < gravedad("densa"));
  assert.equal(repulsion("normal"), AJUSTES_GRAFO.fuerzaResorte * (longitudResorte("normal") / 2) ** 2);
});

test("siembra por capas: posiciones finitas, del largo justo y con componentes separadas", () => {
  const e = construirEscena(grafo(12, [[0, 1], [1, 2], [2, 3], [5, 6], [6, 7]]));
  const semilla = sembrarPorCapas(e, 63);
  assert.equal(semilla.length, 24);
  assert.ok(semilla.every(Number.isFinite));
  // la componente grande arranca en el origen y la siguiente, lejos
  const a = e.ordenEtiquetas[0];
  assert.deepEqual([semilla[a * 2], semilla[a * 2 + 1]], [0, 0]);
  const otro = [5, 6, 7].map((i) => Math.hypot(semilla[i * 2], semilla[i * 2 + 1]));
  assert.ok(Math.max(...otro) > 0);
});

// ── grafo local ──────────────────────────────────────────────────────────────

test("direcciones: saliente, entrante y mutuo respecto del centro; el centro y los de segundo salto, sin dirección", () => {
  const e = construirEscena(grafo(5, [[0, 1], [2, 0], [0, 3], [3, 0], [1, 4]], 0, [0, 1, 1, 1, 2]));
  const d = direccionesDesdeCentro(e);
  assert.equal(d[0], null);
  assert.equal(d[1], "saliente");
  assert.equal(d[2], "entrante");
  assert.equal(d[3], "mutuo");
  assert.equal(d[4], null);
  assert.ok(direccionesDesdeCentro(construirEscena(grafo(3, [[0, 1], [1, 2]]))).every((x) => x === null));
});

test("disposición radial: centro en el origen; salientes a la derecha, entrantes a la izquierda, mutuos arriba", () => {
  const e = construirEscena(grafo(4, [[0, 1], [2, 0], [0, 3], [3, 0]], 0, [0, 1, 1, 1]));
  const r = disposicionRadial(e);
  assert.deepEqual([r.posiciones[0], r.posiciones[1]], [0, 0]);
  assert.equal(r.direcciones[1], "saliente");
  assert.equal(r.direcciones[2], "entrante");
  assert.equal(r.direcciones[3], "mutuo");
  assert.ok(r.posiciones[2] > 0);
  assert.ok(r.posiciones[4] < 0);
  assert.ok(r.posiciones[7] < 0);
  assert.ok(r.radioExterior > 0);
});

test("disposición radial: los de segundo salto caen en un anillo más externo", () => {
  const e = construirEscena(grafo(3, [[0, 1], [1, 2]], 0, [0, 1, 2]));
  const r = disposicionRadial(e);
  const radio = (i: number) => Math.hypot(r.posiciones[i * 2], r.posiciones[i * 2 + 1]);
  assert.ok(radio(2) > radio(1));
  assert.equal(r.radioExterior, radio(2));
});

test("disposición radial: sin profundidades se deduce de la vecindad; un centro solo no falla; sin centro devuelve ceros", () => {
  const sinProfundidad = disposicionRadial(construirEscena(grafo(3, [[0, 1], [1, 2]], 0)));
  assert.ok(sinProfundidad.posiciones.every(Number.isFinite));
  const sola = disposicionRadial(construirEscena(grafo(1, [], 0, [0])));
  assert.equal(sola.posiciones.length, 2);
  assert.ok(sola.posiciones.every(Number.isFinite));
  const sinCentro = disposicionRadial(construirEscena(grafo(3, [[0, 1]])));
  assert.deepEqual(Array.from(sinCentro.posiciones), [0, 0, 0, 0, 0, 0]);
});

test("disposición radial: muchos vecinos juntos se reparten en dos radios para no apilarse", () => {
  const aristas = Array.from({ length: 12 }, (_, i): [number, number] => [0, i + 1]);
  const e = construirEscena(grafo(13, aristas, 0, [0, ...Array.from({ length: 12 }, () => 1)]));
  const r = disposicionRadial(e);
  const radios = new Set(Array.from({ length: 12 }, (_, i) => Math.round(Math.hypot(r.posiciones[(i + 1) * 2], r.posiciones[(i + 1) * 2 + 1]))));
  assert.equal(radios.size, 2);
});

test("grados dirigidos: cuántos enlaces salen y cuántos llegan", () => {
  const g = grafo(3, [[0, 1], [0, 2], [2, 0]]);
  assert.deepEqual(gradosDirigidos(g, 0), { salientes: 2, entrantes: 1 });
  assert.deepEqual(gradosDirigidos(g, 1), { salientes: 0, entrantes: 1 });
});
