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

test("aplica el acelerador de podio (+5% 1ro, +3% 2do, +1% 3ro) sobre los puntos de la tarea", () => {
  const baseInput = {
    generaPuntosYRecompensa: true,
    dificultad: "Ardua" as const,
    tiempoEjecucionEstimadoSeg: 60 * 60, // 100 pts base (4 * √60 * 3.2 ≈ 99)
    newStreakDays: 1, // +1 -> 100 pts
    isChecklist: false,
    checklistCompletados: 0,
    isWeekend: false,
    isHappyHour: false,
    fueIniciada: true,
    esATiempo: true, // +15 speed -> 115 pts antes de acelerador
  };

  const sinPodio = calcularPuntosCompletadoTarea(baseInput);
  assert.equal(sinPodio.rankingBonus, 0);

  const primero = calcularPuntosCompletadoTarea({
    ...baseInput,
    puestoRanking: 1,
    aceleradorRankingPct: 5,
  });
  assert.equal(primero.aceleradorRankingPct, 5);
  assert.equal(primero.rankingBonus, Math.round(sinPodio.rewardPoints * 0.05));
  assert.equal(primero.rewardPoints, sinPodio.rewardPoints + primero.rankingBonus);
  assert.ok(primero.feedback.includes("🥇") && primero.feedback.includes("+5%"));

  const segundo = calcularPuntosCompletadoTarea({
    ...baseInput,
    puestoRanking: 2,
    aceleradorRankingPct: 3,
  });
  assert.equal(segundo.aceleradorRankingPct, 3);
  assert.equal(segundo.rankingBonus, Math.round(sinPodio.rewardPoints * 0.03));
  assert.equal(segundo.rewardPoints, sinPodio.rewardPoints + segundo.rankingBonus);

  const tercero = calcularPuntosCompletadoTarea({
    ...baseInput,
    puestoRanking: 3,
    aceleradorRankingPct: 1,
  });
  assert.equal(tercero.aceleradorRankingPct, 1);
  assert.equal(tercero.rankingBonus, Math.max(1, Math.round(sinPodio.rewardPoints * 0.01)));
  assert.equal(tercero.rewardPoints, sinPodio.rewardPoints + tercero.rankingBonus);
});


