import { test } from "node:test";
import assert from "node:assert/strict";
import { horaActual, horasOrdenadasDesde, HORAS_INFO } from "./horas.ts";

function fechaHoraEnUTC(h: number, m: number): Date {
  return new Date(Date.UTC(2026, 9, 14, h, m, 0));
}

test("horaActual: franjas S8 exactas en los bordes (§10.2, §12)", () => {
  // Matutinum: 00:00 a 04:59
  assert.equal(horaActual(fechaHoraEnUTC(0, 0), "UTC"), "Matutinum");
  assert.equal(horaActual(fechaHoraEnUTC(4, 59), "UTC"), "Matutinum");

  // Laudes: 05:00 a 06:59
  assert.equal(horaActual(fechaHoraEnUTC(5, 0), "UTC"), "Laudes");
  assert.equal(horaActual(fechaHoraEnUTC(6, 59), "UTC"), "Laudes");

  // Prima: 07:00 a 08:29
  assert.equal(horaActual(fechaHoraEnUTC(7, 0), "UTC"), "Prima");
  assert.equal(horaActual(fechaHoraEnUTC(8, 29), "UTC"), "Prima");

  // Tertia: 08:30 a 10:59
  assert.equal(horaActual(fechaHoraEnUTC(8, 30), "UTC"), "Tertia");
  assert.equal(horaActual(fechaHoraEnUTC(10, 59), "UTC"), "Tertia");

  // Sexta: 11:00 a 13:29
  assert.equal(horaActual(fechaHoraEnUTC(11, 0), "UTC"), "Sexta");
  assert.equal(horaActual(fechaHoraEnUTC(13, 29), "UTC"), "Sexta");

  // Nona: 13:30 a 15:59
  assert.equal(horaActual(fechaHoraEnUTC(13, 30), "UTC"), "Nona");
  assert.equal(horaActual(fechaHoraEnUTC(15, 59), "UTC"), "Nona");

  // Vespera: 16:00 a 19:29
  assert.equal(horaActual(fechaHoraEnUTC(16, 0), "UTC"), "Vespera");
  assert.equal(horaActual(fechaHoraEnUTC(19, 29), "UTC"), "Vespera");

  // Completorium: 19:30 a 23:59
  assert.equal(horaActual(fechaHoraEnUTC(19, 30), "UTC"), "Completorium");
  assert.equal(horaActual(fechaHoraEnUTC(23, 59), "UTC"), "Completorium");
});

test("horasOrdenadasDesde: rota cronológicamente a partir de la siguiente", () => {
  const rotadas = horasOrdenadasDesde("Prima");
  assert.equal(rotadas[0].hora, "Tertia");
  assert.equal(rotadas[1].hora, "Sexta");
  assert.equal(rotadas[2].hora, "Nona");
  assert.equal(rotadas[3].hora, "Vespera");
  assert.equal(rotadas[4].hora, "Completorium");
  assert.equal(rotadas[5].hora, "Matutinum");
  assert.equal(rotadas[6].hora, "Laudes");
  assert.equal(rotadas[7].hora, "Prima");
});

test("cada Hora tiene metadatos completos y foto fija de Unsplash con autor", () => {
  for (const info of Object.values(HORAS_INFO)) {
    assert.ok(info.tituloLatino.startsWith("Ad "));
    assert.ok(info.castellano.length > 0);
    assert.ok(info.franja.includes("–"));
    assert.ok(info.fotoUrl.includes("images.unsplash.com"));
    assert.ok(info.autorNombre.length > 0);
    assert.ok(info.autorUrl.startsWith("https://unsplash.com/@"));
  }
});
