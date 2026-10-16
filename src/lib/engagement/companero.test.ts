import test from "node:test";
import assert from "node:assert/strict";
import { avanceDeEtapa, ETAPAS, etapaDe, hayEtapaNueva, mensajeDeRegreso, proximaEtapa, validarNombre } from "./companero.ts";

test("las etapas están ordenadas y empiezan en cero", () => {
  assert.equal(ETAPAS[0].desde, 0);
  const desde = ETAPAS.map((e) => e.desde);
  assert.deepEqual(desde, [...desde].sort((a, b) => a - b));
  assert.deepEqual(ETAPAS.map((e) => e.numero), [1, 2, 3, 4, 5]);
});

test("la etapa depende de los días de uso", () => {
  assert.equal(etapaDe(0).nombre, "Huevito");
  assert.equal(etapaDe(2).nombre, "Huevito");
  assert.equal(etapaDe(3).nombre, "Pichón");
  assert.equal(etapaDe(9).nombre, "Pichón");
  assert.equal(etapaDe(10).nombre, "Palomita");
  assert.equal(etapaDe(30).nombre, "Angelito");
  assert.equal(etapaDe(99).nombre, "Angelito");
  assert.equal(etapaDe(100).nombre, "Ángel guardián");
  assert.equal(etapaDe(1000).nombre, "Ángel guardián");
  assert.equal(etapaDe(-5).nombre, "Huevito");
});

test("próxima etapa y avance", () => {
  assert.deepEqual(proximaEtapa(0), { etapa: ETAPAS[1], faltan: 3 });
  assert.equal(proximaEtapa(2)?.faltan, 1);
  assert.equal(proximaEtapa(100), null);
  assert.equal(avanceDeEtapa(0), 0);
  assert.equal(avanceDeEtapa(1), 33);
  assert.equal(avanceDeEtapa(3), 0);
  assert.equal(avanceDeEtapa(20), 50);
  assert.equal(avanceDeEtapa(150), 100);
});

test("etapa nueva solo cuando supera la última festejada", () => {
  assert.equal(hayEtapaNueva(2, 1), false);
  assert.equal(hayEtapaNueva(3, 1), true);
  assert.equal(hayEtapaNueva(3, 2), false);
  assert.equal(hayEtapaNueva(40, 2), true);
});

test("el regreso es cálido y no cuenta los días perdidos", () => {
  assert.equal(mensajeDeRegreso("Luz", null), null);
  assert.equal(mensajeDeRegreso("Luz", 1), null);
  const m = mensajeDeRegreso("Luz", 6);
  assert.match(m ?? "", /Luz/);
  assert.doesNotMatch(m ?? "", /\d/);
});

test("el nombre se limpia y se valida", () => {
  assert.equal(validarNombre("  Luz   del  sol "), "Luz del sol");
  assert.throws(() => validarNombre("   "), /Escribí un nombre/);
  assert.throws(() => validarNombre("x".repeat(21)), /20/);
  assert.throws(() => validarNombre(null), /Escribí/);
});
