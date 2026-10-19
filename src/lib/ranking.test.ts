import test from "node:test";
import assert from "node:assert/strict";
import {
  MIN_RACHA_RANKING,
  participaEnRanking,
  calcularRankingUsuarios,
  enriquecerUsuariosConRanking,
  aplicarAceleradorRanking,
} from "./ranking.ts";

test("participan en el ranking solo quienes tienen racha diaria de ingreso >= 2 días", () => {
  assert.equal(MIN_RACHA_RANKING, 2);
  assert.equal(participaEnRanking({ id: 1, rachaApp: { dias: 0 } }), false);
  assert.equal(participaEnRanking({ id: 2, rachaApp: { dias: 1 } }), false);
  assert.equal(participaEnRanking({ id: 3, rachaApp: { dias: 2 } }), true);
  assert.equal(participaEnRanking({ id: 4, rachaApp: { dias: 7 } }), true);
});

test("calcularRankingUsuarios filtra por racha >= 2 y asigna emojis (🥇, 🥈, 🥉) y aceleradores (5%, 3%, 1%)", () => {
  const usuarios = [
    { id: 10, nombre: "SinRacha", completionPercentage: 100, stars: 50, puntosAcumulados: 999, rachaApp: { dias: 1 } },
    { id: 1, nombre: "Tercero", completionPercentage: 80, stars: 5, puntosAcumulados: 200, rachaApp: { dias: 3 } },
    { id: 2, nombre: "Primero", completionPercentage: 95, stars: 10, puntosAcumulados: 500, rachaApp: { dias: 2 } },
    { id: 3, nombre: "Segundo", completionPercentage: 90, stars: 8, puntosAcumulados: 350, rachaApp: { dias: 5 } },
    { id: 4, nombre: "Cuarto", completionPercentage: 70, stars: 3, puntosAcumulados: 100, rachaApp: { dias: 4 } },
  ];

  const { participantes, noParticipantes } = calcularRankingUsuarios(usuarios);

  assert.equal(noParticipantes.length, 1);
  assert.equal(noParticipantes[0].id, 10);
  assert.equal(noParticipantes[0].participaRanking, false);
  assert.equal(noParticipantes[0].puestoRanking, null);
  assert.equal(noParticipantes[0].emojiPodio, null);
  assert.equal(noParticipantes[0].aceleradorPct, 0);

  assert.equal(participantes.length, 4);

  // 1er puesto: +5% y 🥇
  assert.equal(participantes[0].id, 2);
  assert.equal(participantes[0].puestoRanking, 1);
  assert.equal(participantes[0].emojiPodio, "🥇");
  assert.equal(participantes[0].aceleradorPct, 5);

  // 2do puesto: +3% y 🥈
  assert.equal(participantes[1].id, 3);
  assert.equal(participantes[1].puestoRanking, 2);
  assert.equal(participantes[1].emojiPodio, "🥈");
  assert.equal(participantes[1].aceleradorPct, 3);

  // 3er puesto: +1% y 🥉
  assert.equal(participantes[2].id, 1);
  assert.equal(participantes[2].puestoRanking, 3);
  assert.equal(participantes[2].emojiPodio, "🥉");
  assert.equal(participantes[2].aceleradorPct, 1);

  // 4to puesto: sin emoji ni acelerador
  assert.equal(participantes[3].id, 4);
  assert.equal(participantes[3].puestoRanking, 4);
  assert.equal(participantes[3].emojiPodio, null);
  assert.equal(participantes[3].aceleradorPct, 0);
});

test("enriquecerUsuariosConRanking conserva el orden original pero adjunta puesto, emoji y acelerador", () => {
  const usuarios = [
    { id: 1, nombre: "Ana", completionPercentage: 70, stars: 1, puntosAcumulados: 100, rachaApp: { dias: 1 } },
    { id: 2, nombre: "Beto", completionPercentage: 90, stars: 5, puntosAcumulados: 300, rachaApp: { dias: 2 } },
  ];

  const enriquecidos = enriquecerUsuariosConRanking(usuarios);
  assert.equal(enriquecidos[0].id, 1);
  assert.equal(enriquecidos[0].emojiPodio, null);
  assert.equal(enriquecidos[0].aceleradorPct, 0);

  assert.equal(enriquecidos[1].id, 2);
  assert.equal(enriquecidos[1].puestoRanking, 1);
  assert.equal(enriquecidos[1].emojiPodio, "🥇");
  assert.equal(enriquecidos[1].aceleradorPct, 5);
});

test("aplicarAceleradorRanking calcula el bono porcentual garantizando al menos +1 punto cuando corresponde", () => {
  const r1 = aplicarAceleradorRanking(100, 5);
  assert.equal(r1.bonoAcelerador, 5);
  assert.equal(r1.puntosTotales, 105);

  const r2 = aplicarAceleradorRanking(100, 3);
  assert.equal(r2.bonoAcelerador, 3);
  assert.equal(r2.puntosTotales, 103);

  const r3 = aplicarAceleradorRanking(10, 1);
  assert.equal(r3.bonoAcelerador, 1);
  assert.equal(r3.puntosTotales, 11);

  const r0 = aplicarAceleradorRanking(100, 0);
  assert.equal(r0.bonoAcelerador, 0);
  assert.equal(r0.puntosTotales, 100);
});
