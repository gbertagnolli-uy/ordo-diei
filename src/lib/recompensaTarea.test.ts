import test from "node:test";
import assert from "node:assert/strict";
import { calcularPuntosCompletadoTarea, DIFICULTADES, puntosBase } from "./recompensaTarea.ts";

test("más dificultad da más puntos con el mismo tiempo", () => {
  const p = DIFICULTADES.map((d) => puntosBase(d, 20 * 60));
  assert.deepEqual([...p].sort((a, b) => a - b), p);
  assert.equal(new Set(p).size, 8);
});

test("más tiempo da más puntos con la misma dificultad, con rendimientos decrecientes", () => {
  const a = puntosBase("Media", 15 * 60);
  const b = puntosBase("Media", 30 * 60);
  const c = puntosBase("Media", 60 * 60);
  assert.ok(a < b && b < c);
  assert.ok(c < 2 * b && b < 2 * a);
});

test("ejemplos del pedido: bañarse < almuerzo < oraciones < rosario", () => {
  const banarse = puntosBase("Facil", 10 * 60);
  const almuerzo = puntosBase("Media", 40 * 60);
  const oraciones = puntosBase("Dificil", 20 * 60);
  const rosario = puntosBase("Ardua", 25 * 60);
  assert.ok(banarse < almuerzo && almuerzo <= oraciones && oraciones < rosario);
});

test("mínimo, máximo y valores raros", () => {
  assert.equal(puntosBase("Trivial", 0), 5);
  assert.equal(puntosBase(null, NaN), 5);
  assert.equal(puntosBase("Ardua", 24 * 3600), 150);
});

test("iniciar tarea y finalizar otorga 100% de los puntos; solo marcar realizada y fuera de horario otorga 80%", () => {
  const comun = {
    generaPuntosYRecompensa: true,
    dificultad: "Media" as const,
    tiempoEjecucionEstimadoSeg: 25 * 60, // √25 = 5 -> 4*5*1.1 = 22 pts base
    newStreakDays: 3, // +4 pts racha -> total 26
    isChecklist: true,
    checklistCompletados: 2, // +10 pts checklist -> total 36
    isWeekend: false,
    isHappyHour: false,
  };

  const iniciada = calcularPuntosCompletadoTarea({
    ...comun,
    fueIniciada: true,
    esATiempo: false,
  });
  assert.equal(iniciada.porcentajeAplicado, 100);
  assert.equal(iniciada.rewardPoints, 36);

  const soloMarcadaFueraDeHorario = calcularPuntosCompletadoTarea({
    ...comun,
    fueIniciada: false,
    esATiempo: false,
  });
  assert.equal(soloMarcadaFueraDeHorario.porcentajeAplicado, 80);
  assert.equal(soloMarcadaFueraDeHorario.rewardPoints, Math.round(36 * 0.8)); // 29 pts
});

