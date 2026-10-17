import test from "node:test";
import assert from "node:assert/strict";
import { MENSAJE_BLOQUEO, mitad, premioConSancion, tieneCartas, errorBloqueo } from "./sancion.ts";
import type { ItemPremio } from "./premios.ts";

test("la mitad se redondea hacia abajo y nunca es negativa", () => {
  assert.equal(mitad(10), 5);
  assert.equal(mitad(15), 7);
  assert.equal(mitad(1), 0);
  assert.equal(mitad(0), 0);
  assert.equal(mitad(-4), 0);
});

test("en un día con sanción, puntos, XP e incienso valen la mitad y los que quedan en cero se descartan", () => {
  const items: ItemPremio[] = [
    { tipo: "puntos", cantidad: 10 },
    { tipo: "xp", cantidad: 50 },
    { tipo: "incienso", cantidad: 1 },
    { tipo: "vale", texto: "un helado" },
  ];
  assert.deepEqual(premioConSancion(items), [
    { tipo: "puntos", cantidad: 5 },
    { tipo: "xp", cantidad: 25 },
    { tipo: "vale", texto: "un helado" },
  ]);
});

test("los premios con cartas se detectan (no se abren en un día con sanción)", () => {
  assert.equal(tieneCartas([{ tipo: "puntos", cantidad: 3 }]), false);
  assert.equal(tieneCartas([{ tipo: "carta", cartaId: 1, nombre: "San Miguel", modo: "completa" }]), true);
});

test("los mensajes de bloqueo avisan que es por mal comportamiento y que se vuelve mañana", () => {
  for (const que of ["tienda", "cartas", "cofre"] as const) {
    assert.match(MENSAJE_BLOQUEO[que].texto, /mal comportamiento/);
    assert.match(MENSAJE_BLOQUEO[que].texto, /mañana/);
    assert.equal(errorBloqueo(que), MENSAJE_BLOQUEO[que].texto);
  }
});
