import test from "node:test";
import assert from "node:assert/strict";
import { cofreMerecido, contenidoCofre, diaEsBueno, elegirRareza, PESOS_RAREZA_COFRE } from "./cofre.ts";

test("los pesos de rareza suman 100 y el sorteo respeta los bordes", () => {
  assert.equal(Object.values(PESOS_RAREZA_COFRE).reduce((a, b) => a + b, 0), 100);
  assert.equal(elegirRareza(0), "Comun");
  assert.equal(elegirRareza(0.59), "Comun");
  assert.equal(elegirRareza(0.6), "Buena");
  assert.equal(elegirRareza(0.89), "Perfecta");
  assert.equal(elegirRareza(0.99), "Celestial");
});

test("un día es bueno solo si hay más positivos que negativos", () => {
  assert.equal(diaEsBueno(0, 0), false);
  assert.equal(diaEsBueno(1, 0), true);
  assert.equal(diaEsBueno(1, 1), false);
  assert.equal(diaEsBueno(3, 1), true);
});

test("el cofre trae puntos, XP y un fragmento", () => {
  const c = contenidoCofre({ id: 5, nombre: "San Miguel" });
  assert.deepEqual(c.map((i) => i.tipo), ["puntos", "xp", "carta"]);
});

test("la conducta marcada decide el cofre; sin marca vale la regla de siempre", () => {
  assert.equal(cofreMerecido(0, 0, 4), true);
  assert.equal(cofreMerecido(5, 0, 3), false);
  assert.equal(cofreMerecido(0, 3, 5), true);
  assert.equal(cofreMerecido(1, 0, null), true);
  assert.equal(cofreMerecido(0, 0, null), false);
});
