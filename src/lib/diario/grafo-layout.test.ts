import { test } from "node:test";
import assert from "node:assert/strict";
import { disponerHastaElFinal, disponerPorFuerzas, normalizar, posicionesIniciales, type ParametrosFuerzas } from "./grafo-layout.ts";

const RESORTE = 60;

function parametros(iteraciones: number, extra: Partial<ParametrosFuerzas> = {}): ParametrosFuerzas {
  return {
    iteraciones,
    theta: 0.9,
    repulsion: 0.08 * (RESORTE / 2) * (RESORTE / 2),
    largoResorte: RESORTE,
    fuerzaResorte: 0.08,
    gravedad: 0.02,
    radioColision: 12,
    decaimientoVelocidad: 0.4,
    emitirCada: 1,
    alfaInicial: 1,
    pasoMinimo: 0,
    fijos: 0,
    normalizarEscala: false,
    ...extra,
  };
}

const cadena = (n: number): number[] => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]).flat();
const largos = (pos: Float32Array, aristas: number[]): number[] => {
  const salida: number[] = [];
  for (let k = 0; k < aristas.length; k += 2) salida.push(Math.hypot(pos[aristas[k + 1] * 2] - pos[aristas[k] * 2], pos[aristas[k + 1] * 2 + 1] - pos[aristas[k] * 2 + 1]));
  return salida;
};
const mediana = (v: number[]): number => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)];

test("fuerzas: las posiciones quedan finitas y del largo justo", () => {
  const { posiciones } = disponerHastaElFinal(50, cadena(50), null, parametros(200));
  assert.equal(posiciones.length, 100);
  assert.ok(posiciones.every(Number.isFinite));
});

test("fuerzas: los nodos enlazados se acercan a una distancia de equilibrio razonable", () => {
  const aristas = cadena(20);
  // con theta casi 0 la repulsión es exacta; con 0.9 (Barnes–Hut) hay un error de unos pocos por ciento que ensancha algún enlace
  const exacta = disponerHastaElFinal(20, aristas, null, parametros(400, { theta: 0.01 }));
  for (const d of largos(exacta.posiciones, aristas)) assert.ok(d > RESORTE * 0.5 && d < RESORTE * 4, `distancia ${d}`);
  const aproximada = disponerHastaElFinal(20, aristas, null, parametros(400));
  for (const d of largos(aproximada.posiciones, aristas)) assert.ok(d > RESORTE * 0.5 && d < RESORTE * 6, `distancia ${d}`);
});

test("fuerzas: la repulsión aproximada es parecida a la exacta (árbol de Barnes–Hut)", () => {
  const aristas = cadena(40);
  const exacta = disponerHastaElFinal(40, aristas, null, parametros(300, { theta: 0.01 })).posiciones;
  const aprox = disponerHastaElFinal(40, aristas, null, parametros(300)).posiciones;
  const mediaExacta = mediana(largos(exacta, aristas));
  const mediaAprox = mediana(largos(aprox, aristas));
  assert.ok(Math.abs(mediaAprox - mediaExacta) / mediaExacta < 0.25, `${mediaAprox} frente a ${mediaExacta}`);
});

test("fuerzas: 0 y 1 nodos entregan un solo cuadro y 2 nodos no fallan", () => {
  assert.equal([...disponerPorFuerzas(0, [], null, parametros(50))].length, 1);
  const uno = [...disponerPorFuerzas(1, [], null, parametros(50))];
  assert.equal(uno.length, 1);
  assert.equal(uno[0].length, 2);
  const dos = disponerHastaElFinal(2, [0, 1], null, parametros(50));
  assert.ok(dos.posiciones.every(Number.isFinite));
});

test("fuerzas: las colisiones mantienen una distancia mínima entre cualquier par", () => {
  const n = 31;
  const estrella = Array.from({ length: n - 1 }, (_, i) => [0, i + 1]).flat();
  const { posiciones } = disponerHastaElFinal(n, estrella, null, parametros(400));
  let minimo = Infinity;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) minimo = Math.min(minimo, Math.hypot(posiciones[j * 2] - posiciones[i * 2], posiciones[j * 2 + 1] - posiciones[i * 2 + 1]));
  assert.ok(minimo >= 2 * 12 * 0.8, `distancia mínima ${minimo}`);
});

test("fuerzas: la escala normalizada deja la mediana del largo de los enlaces cerca del largo del resorte", () => {
  const aristas = [...cadena(30), 29, 30, ...Array.from({ length: 29 }, (_, i) => [30, 31 + i]).flat()];
  const cruda = disponerHastaElFinal(60, aristas, null, parametros(600));
  assert.ok(mediana(largos(cruda.posiciones, aristas)) / RESORTE > 2, "sin normalizar el diseño se ensancha");
  const normal = disponerHastaElFinal(60, aristas, null, parametros(600, { normalizarEscala: true }));
  const razon = mediana(largos(normal.posiciones, aristas)) / RESORTE;
  assert.ok(razon >= 0.6 && razon <= 1.6, `razón ${razon}`);
});

test("fuerzas: los nodos fijos no se mueven", () => {
  const n = 40;
  const estrella = Array.from({ length: n - 1 }, (_, i) => [0, i + 1]).flat();
  const inicial = Array.from(posicionesIniciales(n, null));
  inicial[0] = 17.5;
  inicial[1] = -3.25;
  const { posiciones } = disponerHastaElFinal(n, estrella, inicial, parametros(200, { fijos: 1 }));
  assert.equal(posiciones[0], 17.5);
  assert.equal(posiciones[1], -3.25);
});

test("fuerzas: con un paso mínimo se detiene antes de las iteraciones máximas", () => {
  const { cuadros } = disponerHastaElFinal(8, cadena(8), null, parametros(1000, { pasoMinimo: 1e-3 }));
  assert.ok(cuadros < 1000, `se entregaron ${cuadros} cuadros`);
});

test("fuerzas: emite un cuadro de partida, uno cada N iteraciones y el último", () => {
  const cuadros = [...disponerPorFuerzas(10, cadena(10), null, parametros(100, { emitirCada: 25 }))];
  // partida + iteraciones 0, 25, 50, 75 + la última (99)
  assert.equal(cuadros.length, 6);
});

test("fuerzas: mismos datos, mismo resultado", () => {
  const a = disponerHastaElFinal(25, cadena(25), null, parametros(150)).posiciones;
  const b = disponerHastaElFinal(25, cadena(25), null, parametros(150)).posiciones;
  assert.deepEqual(Array.from(a), Array.from(b));
});

test("fuerzas: con nodos encimados no aparecen NaN", () => {
  const inicial = new Array(20).fill(0);
  const { posiciones } = disponerHastaElFinal(10, cadena(10), inicial, parametros(100));
  assert.ok(posiciones.every(Number.isFinite));
});

test("fuerzas: datos inválidos", () => {
  assert.throws(() => [...disponerPorFuerzas(3, [0, 1, 2], null, parametros(10))], /longitud/);
  assert.throws(() => [...disponerPorFuerzas(3, [0, 5], null, parametros(10))], /fuera de rango/);
  assert.throws(() => [...disponerPorFuerzas(3, [0, -1], null, parametros(10))], /fuera de rango/);
  assert.throws(() => [...disponerPorFuerzas(3, [], [1, 2], parametros(10))], /initial_positions/);
});

test("parámetros: lo que vale cero toma el valor por omisión", () => {
  const p = normalizar(parametros(0, { theta: 0, repulsion: 0, largoResorte: 0, fuerzaResorte: 0, radioColision: 0, decaimientoVelocidad: 0, emitirCada: 0, alfaInicial: 0, gravedad: -1 }));
  assert.equal(p.iteraciones, 400);
  assert.equal(p.thetaCuadrado, 0.81);
  assert.equal(p.repulsion, 72);
  assert.equal(p.largoResorte, 60);
  assert.equal(p.fuerzaResorte, 0.08);
  assert.equal(p.radioColision, 12);
  assert.equal(p.velocidadRetenida, 0.6);
  assert.equal(p.emitirCada, 1);
  assert.equal(p.alfaInicial, 1);
  assert.equal(p.gravedad, 0.02);
});

test("posiciones de partida: espiral áurea sin datos; con datos, una copia", () => {
  const e = posicionesIniciales(5, null);
  assert.equal(e.length, 10);
  assert.deepEqual([e[0], e[1]], [0, 0]);
  const dada = [1, 2, 3, 4];
  const copia = posicionesIniciales(2, dada);
  assert.deepEqual(Array.from(copia), dada);
  assert.equal(posicionesIniciales(0, null).length, 0);
});

test("rendimiento: 600 nodos y 700 enlaces terminan en un tiempo razonable", () => {
  const n = 600;
  const aristas: number[] = [];
  for (let i = 1; i < n; i++) aristas.push(Math.floor(i / 2), i);
  for (let i = 0; i < 100; i++) aristas.push(i, (i * 7 + 13) % n);
  const t0 = Date.now();
  const { posiciones } = disponerHastaElFinal(n, aristas, null, parametros(300, { emitirCada: 100, normalizarEscala: true }));
  assert.ok(posiciones.every(Number.isFinite));
  assert.ok(Date.now() - t0 < 20_000, `tardó ${Date.now() - t0} ms`);
});
