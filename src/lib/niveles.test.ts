import test from "node:test";
import assert from "node:assert/strict";
import { nivelDe, xpTotal, tituloDeNivel, TITULOS, badgeDeNivel, PUNTOS_SUBIR_NIVEL, NIVELES_CON_BADGE } from "./niveles.ts";

test("curva de niveles: umbrales estándar y porcentaje de progreso", () => {
  // Nivel 1: 0 a 99 XP
  const n0 = nivelDe(0);
  assert.equal(n0.level, 1);
  assert.equal(n0.title, "Novato");
  assert.equal(n0.progressPercentage, 0);
  assert.equal(n0.pointsToNextLevel, 100);

  const n50 = nivelDe(50);
  assert.equal(n50.level, 1);
  assert.equal(n50.progressPercentage, 50);
  assert.equal(n50.pointsToNextLevel, 50);

  // Nivel 2: 100 XP
  const n100 = nivelDe(100);
  assert.equal(n100.level, 2);
  assert.equal(n100.title, "Iniciado");
  assert.equal(n100.progressPercentage, 0);
  assert.equal(n100.pointsToNextLevel, 300); // 400 - 100 = 300

  // Nivel 3: 400 XP
  const n400 = nivelDe(400);
  assert.equal(n400.level, 3);
  assert.equal(n400.title, "Aprendiz avanzado");

  // Nivel 4: 900 XP (mantiene Aprendiz avanzado)
  const n900 = nivelDe(900);
  assert.equal(n900.level, 4);
  assert.equal(n900.title, "Aprendiz avanzado");

  // Nivel 5: 1600 XP (Guerrero disciplinado)
  const n1600 = nivelDe(1600);
  assert.equal(n1600.level, 5);
  assert.equal(n1600.title, "Guerrero disciplinado");

  // Nivel 7: 3600 XP (Experto)
  const n3600 = nivelDe(3600);
  assert.equal(n3600.level, 7);
  assert.equal(n3600.title, "Experto");

  // Nivel 10: 8100 XP (Maestro de tareas)
  const n8100 = nivelDe(8100);
  assert.equal(n8100.level, 10);
  assert.equal(n8100.title, "Maestro de tareas");

  // Nivel 15: 19600 XP (Héroe legendario)
  const n19600 = nivelDe(19600);
  assert.equal(n19600.level, 15);
  assert.equal(n19600.title, "Héroe legendario");

  // Nivel 20: 36100 XP (Columna de la familia)
  const n36100 = nivelDe(36100);
  assert.equal(n36100.level, 20);
  assert.equal(n36100.title, "Columna de la familia");

  // Nivel 25: 57600 XP (Ejemplo de virtud)
  const n57600 = nivelDe(57600);
  assert.equal(n57600.level, 25);
  assert.equal(n57600.title, "Ejemplo de virtud");

  // Nivel 30: 84100 XP (Leyenda de Ordo Diei)
  const n84100 = nivelDe(84100);
  assert.equal(n84100.level, 30);
  assert.equal(n84100.title, "Leyenda de Ordo Diei");
});

test("títulos de nivel respetan la lista de §5 y conservan el título previo entre saltos", () => {
  assert.equal(TITULOS.length, 10);
  assert.equal(tituloDeNivel(1), "Novato");
  assert.equal(tituloDeNivel(2), "Iniciado");
  assert.equal(tituloDeNivel(3), "Aprendiz avanzado");
  assert.equal(tituloDeNivel(4), "Aprendiz avanzado");
  assert.equal(tituloDeNivel(5), "Guerrero disciplinado");
  assert.equal(tituloDeNivel(6), "Guerrero disciplinado");
  assert.equal(tituloDeNivel(7), "Experto");
  assert.equal(tituloDeNivel(8), "Experto");
  assert.equal(tituloDeNivel(9), "Experto");
  assert.equal(tituloDeNivel(10), "Maestro de tareas");
  assert.equal(tituloDeNivel(14), "Maestro de tareas");
  assert.equal(tituloDeNivel(15), "Héroe legendario");
  assert.equal(tituloDeNivel(19), "Héroe legendario");
  assert.equal(tituloDeNivel(20), "Columna de la familia");
  assert.equal(tituloDeNivel(24), "Columna de la familia");
  assert.equal(tituloDeNivel(25), "Ejemplo de virtud");
  assert.equal(tituloDeNivel(29), "Ejemplo de virtud");
  assert.equal(tituloDeNivel(30), "Leyenda de Ordo Diei");
  assert.equal(tituloDeNivel(50), "Leyenda de Ordo Diei");
});

test("xpTotal suma correctamente puntosAcumulados y experienciaHabitos de forma segura", () => {
  assert.equal(xpTotal(null), 0);
  assert.equal(xpTotal(undefined), 0);
  assert.equal(xpTotal({}), 0);
  assert.equal(xpTotal({ puntosAcumulados: 150 }), 150);
  assert.equal(xpTotal({ experienciaHabitos: 40 }), 40);
  assert.equal(xpTotal({ puntosAcumulados: 250, experienciaHabitos: 70 }), 320);

  // Valores negativos no restan
  assert.equal(xpTotal({ puntosAcumulados: -20, experienciaHabitos: 50 }), 50);
  assert.equal(xpTotal({ puntosAcumulados: 50, experienciaHabitos: -10 }), 50);
});

test("badgeDeNivel devuelve la imagen del nivel entre 1 y 12, y PUNTOS_SUBIR_NIVEL es 200", () => {
  assert.equal(PUNTOS_SUBIR_NIVEL, 200);
  assert.equal(NIVELES_CON_BADGE, 12);
  assert.equal(badgeDeNivel(0), "/niveles/1.webp");
  assert.equal(badgeDeNivel(1), "/niveles/1.webp");
  assert.equal(badgeDeNivel(4), "/niveles/4.webp");
  assert.equal(badgeDeNivel(12), "/niveles/12.webp");
  assert.equal(badgeDeNivel(15), "/niveles/12.webp");
  assert.equal(badgeDeNivel(30), "/niveles/12.webp");
});

