import { test } from "node:test";
import assert from "node:assert/strict";
import { datosAlRechazar, MARCA_RECHAZO } from "./rechazo.ts";

const ahora = new Date(2026, 10, 6, 15, 0, 0);
const horas = (h: number) => new Date(ahora.getTime() + h * 3600_000);

test("vuelve como pendiente, con el cronómetro en cero y la marca Rehacer", () => {
  const d = datosAlRechazar({ fechaVencimiento: horas(5), horaEjecucion: null }, ahora);
  assert.equal(d.estado, "Pendiente");
  assert.equal(d.timerStartedAt, null);
  assert.equal(d.tiempoAcumuladoTimer, 0);
  assert.equal(d.puntosGenerados, 0);
  assert.equal(d.fotoPruebaUrl, null);
  assert.equal(d.retroalimentacionAlgoritmo, MARCA_RECHAZO);
});

test("con 2 horas o más de margen no cambia el vencimiento", () => {
  const d = datosAlRechazar({ fechaVencimiento: horas(2), horaEjecucion: null }, ahora);
  assert.equal("fechaVencimiento" in d, false);
  assert.equal("horaEjecucion" in d, false);
});

test("vencida o con menos de 2 horas: vence en 24 horas y se borra la hora", () => {
  for (const vence of [horas(-30), horas(1)]) {
    const d = datosAlRechazar({ fechaVencimiento: null, horaEjecucion: vence }, ahora);
    assert.deepEqual(d.fechaVencimiento, horas(24));
    assert.equal(d.horaEjecucion, null);
  }
});

test("sin fecha no inventa un vencimiento", () => {
  const d = datosAlRechazar({ fechaVencimiento: null, horaEjecucion: null }, ahora);
  assert.equal("fechaVencimiento" in d, false);
});
