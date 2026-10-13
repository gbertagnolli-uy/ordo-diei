import test from "node:test";
import assert from "node:assert/strict";
import { esAutomatico, leerItems, textoItem, validarItems } from "./premios.ts";

test("validarItems normaliza y descarta campos ajenos", () => {
  const items = validarItems([
    { tipo: "puntos", cantidad: "50", extra: 1 },
    { tipo: "carta", cartaId: 3, nombre: "San José", modo: "completa" },
    { tipo: "carta", cartaId: 4, modo: "fragmentos", cantidad: 5 },
    { tipo: "extra", texto: "  un helado " },
  ]);
  assert.deepEqual(items[0], { tipo: "puntos", cantidad: 50 });
  assert.deepEqual(items[1], { tipo: "carta", cartaId: 3, nombre: "San José", modo: "completa" });
  assert.equal(items[2].tipo === "carta" && items[2].cantidad, 5);
  assert.deepEqual(items[3], { tipo: "extra", texto: "un helado" });
});

test("validarItems rechaza cantidades y tipos inválidos", () => {
  assert.throws(() => validarItems([{ tipo: "puntos", cantidad: 0 }]));
  assert.throws(() => validarItems([{ tipo: "xp", cantidad: 1.5 }]));
  assert.throws(() => validarItems([{ tipo: "oro", cantidad: 1 }]));
  assert.throws(() => validarItems([{ tipo: "extra", texto: "   " }]));
  assert.throws(() => validarItems(Array.from({ length: 11 }, () => ({ tipo: "xp", cantidad: 1 }))));
});

test("leerItems tolera datos rotos y esAutomatico separa lo que entrega un padre", () => {
  assert.deepEqual(leerItems("basura"), []);
  assert.deepEqual(leerItems([{ tipo: "oro" }]), []);
  assert.equal(esAutomatico({ tipo: "incienso", cantidad: 2 }), true);
  assert.equal(esAutomatico({ tipo: "exoneracion", texto: "platos" }), false);
  assert.equal(textoItem({ tipo: "incienso", cantidad: 1 }), "1 grano de incienso");
});

test("el vale se valida, se muestra como «Vale por…» y no necesita que un padre lo entregue", () => {
  const [vale] = validarItems([{ tipo: "vale", texto: "  un viaje a Beto Carrero World ", extra: 1 }]);
  assert.deepEqual(vale, { tipo: "vale", texto: "un viaje a Beto Carrero World" });
  assert.equal(textoItem(vale), "Vale por un viaje a Beto Carrero World");
  assert.equal(esAutomatico(vale), true);
  assert.throws(() => validarItems([{ tipo: "vale", texto: "  " }]));
});
