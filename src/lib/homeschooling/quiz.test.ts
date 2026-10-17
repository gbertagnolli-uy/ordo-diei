import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularNota, fallosSeguidosDe, proximoCheckpoint, validarPreguntas } from "./quiz.ts";
import { nuevaTarjeta, responderTarjeta } from "./servidor/repaso.ts";

const preg = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, correcta: 0 }));
const aciertos = (n: number, total: number) => Object.fromEntries(Array.from({ length: total }, (_, i) => [i + 1, i < n ? 0 : 1]));

test("calcularNota: 0 de 3, 7 de 10, 2 de 3, 3 de 3 y sin preguntas", () => {
  assert.equal(calcularNota(preg(3), aciertos(0, 3)), 0);
  assert.equal(calcularNota(preg(10), aciertos(7, 10)), 70);
  assert.equal(calcularNota(preg(3), aciertos(2, 3)), 67);
  assert.equal(calcularNota(preg(3), aciertos(3, 3)), 100);
  assert.equal(calcularNota([], {}), 100);
  assert.ok(calcularNota(preg(10), aciertos(7, 10)) >= 70); // aprueba con umbral 70 (>=)
});

test("calcularNota: una pregunta sin responder cuenta como error", () => {
  assert.equal(calcularNota(preg(2), { 1: 0 }), 50);
});

test("proximoCheckpoint: >= y el primero sin responder (X21)", () => {
  const cp = [30, 90, 150];
  assert.equal(proximoCheckpoint(29, cp, new Set()), null);
  assert.equal(proximoCheckpoint(30, cp, new Set()), 30);
  assert.equal(proximoCheckpoint(95, cp, new Set()), 30); // adelantó: sale el primero, no el 90
  assert.equal(proximoCheckpoint(200, cp, new Set([30])), 90);
  assert.equal(proximoCheckpoint(200, cp, new Set([30, 90, 150])), null);
  assert.equal(proximoCheckpoint(0, [], new Set()), null);
});

test("fallosSeguidosDe: no aprobados desde el último aprobado", () => {
  assert.equal(fallosSeguidosDe([]), 0);
  assert.equal(fallosSeguidosDe([{ aprobado: false }, { aprobado: false }]), 2);
  assert.equal(fallosSeguidosDe([{ aprobado: false }, { aprobado: true }, { aprobado: false }]), 1);
  assert.equal(fallosSeguidosDe([{ aprobado: false }, { aprobado: false }, { aprobado: true }]), 0);
});

test("validarPreguntas: 2–4 opciones, correcta en rango, enunciado y segundos distintos", () => {
  const ok = { enunciado: "¿2+2?", opciones: ["3", "4"], correcta: 1 };
  assert.deepEqual(validarPreguntas([ok]), []);
  assert.equal(validarPreguntas([{ ...ok, opciones: ["solo una"], correcta: 0 }]).length > 0, true);
  assert.equal(validarPreguntas([{ ...ok, opciones: ["a", "b", "c", "d", "e"] }]).length > 0, true);
  assert.equal(validarPreguntas([{ ...ok, correcta: 2 }]).length > 0, true);
  assert.equal(validarPreguntas([{ ...ok, enunciado: " " }]).length > 0, true);
  assert.equal(validarPreguntas([{ ...ok, segundoVideo: 30 }, { ...ok, segundoVideo: 30 }]).length > 0, true);
});

test("repaso: el acierto aleja `proximo` y el fallo lo acerca", () => {
  const t0 = new Date("2030-01-01T12:00:00Z");
  const { tarjeta } = nuevaTarjeta(t0);
  const bien = responderTarjeta(tarjeta, true, t0);
  const mal = responderTarjeta(tarjeta, false, t0);
  assert.ok(bien.proximo.getTime() > mal.proximo.getTime());
  assert.ok(bien.proximo.getTime() > t0.getTime() && mal.proximo.getTime() > t0.getTime());
  assert.equal(bien.tarjeta._aciertos, 1);
  assert.equal(mal.tarjeta._aciertos, 0);
});

test("repaso: se resuelve tras 3 aciertos seguidos con intervalo ≥ 30 días, y un fallo reinicia la cuenta", () => {
  let ahora = new Date("2030-01-01T12:00:00Z");
  let { tarjeta } = nuevaTarjeta(ahora);
  let resuelta = false;
  for (let i = 0; i < 20 && !resuelta; i++) {
    const r = responderTarjeta(tarjeta, true, ahora);
    tarjeta = r.tarjeta;
    ahora = r.proximo;
    resuelta = r.resuelta;
  }
  assert.equal(resuelta, true);
  assert.ok(tarjeta._aciertos >= 3);
  assert.equal(responderTarjeta(tarjeta, false, ahora).tarjeta._aciertos, 0);
});
