import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clasificarClaveTempora,
  filtrarSantosPorMes,
  buscarSantos,
  textoRango,
  deducirColorSanto,
} from "./proprium.ts";
import type { EntradaKalendarium } from "./lecturas.ts";

test("clasificarClaveTempora: clasifica correctamente los 8 tiempos litúrgicos", () => {
  assert.equal(clasificarClaveTempora("Tempora/Adv1-0", "Dominica I Adventus"), "Adventus");
  assert.equal(clasificarClaveTempora("Tempora/Nat01", "In Nativitate Domini"), "Nativitas");
  assert.equal(clasificarClaveTempora("Missa/Tempora/Epi1-0", "Dominica I post Epiphaniam"), "Epiphania");
  assert.equal(clasificarClaveTempora("Tempora/Quadp1-0", "Dominica in Septuagesima"), "Septuagesima");
  assert.equal(clasificarClaveTempora("Tempora/Quad1-0", "Dominica I in Quadragesima"), "Quadragesima");
  assert.equal(clasificarClaveTempora("Tempora/Quad5-0", "Dominica de Passione"), "Passio");
  assert.equal(clasificarClaveTempora("Tempora/Quad6-0", "Dominica in Palmis"), "Passio");
  assert.equal(clasificarClaveTempora("Tempora/Pasc0-0", "Dominica Resurrectionis"), "Pascha");
  assert.equal(clasificarClaveTempora("Missa/Tempora/Pent04-2", "Feria Tertia"), "Pentecostes");
});

test("textoRango: traduce números de rango a etiquetas latinas de rúbricas", () => {
  assert.equal(textoRango(1), "Simplex");
  assert.equal(textoRango(2), "Semiduplex");
  assert.equal(textoRango(3), "Duplex");
  assert.equal(textoRango(4), "Duplex II. classis");
  assert.equal(textoRango(5), "Duplex I. classis");
  assert.equal(textoRango(6), "Duplex I. classis cum octava");
  assert.equal(textoRango(0), "Memoria");
});

test("deducirColorSanto: mártires son rojos, vigilias moradas, resto blanco", () => {
  assert.equal(deducirColorSanto("S. Callisti Papæ et Martyris"), "rojo");
  assert.equal(deducirColorSanto("SS. Cornelii et Cypriani Mm."), "rojo");
  assert.equal(deducirColorSanto("In Vigilia S. Andreae"), "morado");
  assert.equal(deducirColorSanto("S. Teresiae Virginis"), "blanco");
  assert.equal(deducirColorSanto("S. Ioseph Confessoris"), "blanco");
});

test("filtrarSantosPorMes y buscarSantos", () => {
  const santos: EntradaKalendarium[] = [
    { fecha: "10-14", archivo: "Sancti/10-14", nombre: "S. Callisti", rango: 3 },
    { fecha: "10-15", archivo: "Sancti/10-15", nombre: "S. Teresiae", rango: 3 },
    { fecha: "11-01", archivo: "Sancti/11-01", nombre: "Omnium Sanctorum", rango: 5 },
  ];

  const octubre = filtrarSantosPorMes(santos, "10");
  assert.equal(octubre.length, 2);
  assert.deepEqual(octubre.map((s) => s.fecha), ["10-14", "10-15"]);

  const noviembre = filtrarSantosPorMes(santos, "11");
  assert.equal(noviembre.length, 1);
  assert.equal(noviembre[0].fecha, "11-01");

  const busqueda = buscarSantos(santos, "teres");
  assert.equal(busqueda.length, 1);
  assert.equal(busqueda[0].nombre, "S. Teresiae");

  const busquedaFecha = buscarSantos(santos, "10-14");
  assert.equal(busquedaFecha.length, 1);
  assert.equal(busquedaFecha[0].nombre, "S. Callisti");
});
