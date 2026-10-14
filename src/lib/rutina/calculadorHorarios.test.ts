import test from "node:test";
import assert from "node:assert/strict";
import {
  horaAMinutos,
  esDiaAplicable,
  estaEnIntervalo,
  duracionEtapaSegundos,
  obtenerEtapaActual,
  obtenerProximaEtapa,
  calcularProgresoEtapa,
  formatearSegundos,
  formatearTiempoHumano,
} from "./calculadorHorarios.ts";
import { RUTINA_PREDETERMINADA } from "./tipos.ts";

test("horaAMinutos convierte correctamente strings HH:mm", () => {
  assert.equal(horaAMinutos("00:00"), 0);
  assert.equal(horaAMinutos("08:00"), 480);
  assert.equal(horaAMinutos("08:15"), 495);
  assert.equal(horaAMinutos("12:00"), 720);
  assert.equal(horaAMinutos("23:59"), 1439);
});

test("esDiaAplicable respeta días laborables, fines de semana y todos", () => {
  // Lunes = 1, Viernes = 5, Sábado = 6, Domingo = 0
  assert.equal(esDiaAplicable("todos", 0), true);
  assert.equal(esDiaAplicable("todos", 3), true);

  assert.equal(esDiaAplicable("laborables", 1), true);
  assert.equal(esDiaAplicable("laborables", 5), true);
  assert.equal(esDiaAplicable("laborables", 0), false);
  assert.equal(esDiaAplicable("laborables", 6), false);

  assert.equal(esDiaAplicable("finDeSemana", 0), true);
  assert.equal(esDiaAplicable("finDeSemana", 6), true);
  assert.equal(esDiaAplicable("finDeSemana", 3), false);

  assert.equal(esDiaAplicable([1, 3, 5], 1), true);
  assert.equal(esDiaAplicable([1, 3, 5], 2), false);
});

test("estaEnIntervalo maneja horarios diurnos y que cruzan medianoche", () => {
  // 09:00 (540 min) a 09:25 (565 min)
  assert.equal(estaEnIntervalo(540, "09:00", "09:25"), true);
  assert.equal(estaEnIntervalo(550, "09:00", "09:25"), true);
  assert.equal(estaEnIntervalo(565, "09:00", "09:25"), false);
  assert.equal(estaEnIntervalo(539, "09:00", "09:25"), false);

  // 22:00 (1320 min) a 08:00 (480 min)
  assert.equal(estaEnIntervalo(1320, "22:00", "08:00"), true); // 22:00
  assert.equal(estaEnIntervalo(1400, "22:00", "08:00"), true); // 23:20
  assert.equal(estaEnIntervalo(100, "22:00", "08:00"), true);  // 01:40
  assert.equal(estaEnIntervalo(479, "22:00", "08:00"), true);  // 07:59
  assert.equal(estaEnIntervalo(480, "22:00", "08:00"), false); // 08:00
  assert.equal(estaEnIntervalo(600, "22:00", "08:00"), false); // 10:00
});

test("duracionEtapaSegundos calcula la duración precisa", () => {
  assert.equal(duracionEtapaSegundos("08:00", "08:15"), 15 * 60);
  assert.equal(duracionEtapaSegundos("09:00", "09:25"), 25 * 60);
  assert.equal(duracionEtapaSegundos("10:20", "12:00"), 100 * 60);
  // Cruce medianoche: 22:00 a 08:00 = 10 horas = 600 min
  assert.equal(duracionEtapaSegundos("22:00", "08:00"), 600 * 60);
});

test("obtenerEtapaActual detecta la etapa correspondiente a la hora del día", () => {
  // Simular fecha un lunes a las 08:10:00
  const fechaManana = new Date(2026, 9, 12, 8, 10, 0); // Lunes
  const actual = obtenerEtapaActual(RUTINA_PREDETERMINADA, fechaManana);
  assert.ok(actual.etapa);
  assert.equal(actual.etapa?.id, "etapa-01");
  assert.equal(actual.etapa?.titulo, "Levantarse, vestirse, lavarse la cara, peinarse");

  // A las 12:15
  const fechaMediodia = new Date(2026, 9, 12, 12, 15, 0);
  const actualMediodia = obtenerEtapaActual(RUTINA_PREDETERMINADA, fechaMediodia);
  assert.equal(actualMediodia.etapa?.id, "etapa-12");
  assert.equal(actualMediodia.etapa?.titulo, "Ángelus - Preparar almuerzo");

  // A las 23:30 (durmiendo)
  const fechaNoche = new Date(2026, 9, 12, 23, 30, 0);
  const actualNoche = obtenerEtapaActual(RUTINA_PREDETERMINADA, fechaNoche);
  assert.equal(actualNoche.etapa?.id, "etapa-28");
  assert.equal(actualNoche.etapa?.titulo, "A dormir...");
});

test("obtenerProximaEtapa entrega la siguiente etapa y el tiempo que falta", () => {
  // A las 08:10:00 (en etapa 1, que termina a las 08:15, próxima es etapa 2 a las 08:15)
  const fecha = new Date(2026, 9, 12, 8, 10, 0);
  const prox = obtenerProximaEtapa(RUTINA_PREDETERMINADA, fecha);
  assert.ok(prox.etapa);
  assert.equal(prox.etapa?.id, "etapa-02");
  assert.equal(prox.restanteSeg, 5 * 60); // 5 minutos
});

test("calcularProgresoEtapa calcula porcentaje y fases correctamente", () => {
  const etapa = {
    id: "test",
    titulo: "Test",
    horaInicio: "10:00",
    horaFin: "10:30",
    duracionMin: 30,
    categoria: "estudio" as const,
    icono: "BookOpen",
    alarmaSonora: true,
    diasSemana: "todos" as const,
  };

  // A las 10:05 (5 min de 30) -> restan 25 min (~83% restante, fase verde)
  const f1 = new Date(2026, 9, 12, 10, 5, 0);
  const prog1 = calcularProgresoEtapa(etapa, f1);
  assert.equal(prog1.totalSeg, 1800);
  assert.equal(prog1.transcurridoSeg, 300);
  assert.equal(prog1.restanteSeg, 1500);
  assert.equal(prog1.fase, "verde");

  // A las 10:20 (20 min de 30) -> restan 10 min (~33% restante, fase ambar)
  const f2 = new Date(2026, 9, 12, 10, 20, 0);
  const prog2 = calcularProgresoEtapa(etapa, f2);
  assert.equal(prog2.fase, "ambar");

  // A las 10:27 (27 min de 30) -> restan 3 min (10% restante, fase rojo)
  const f3 = new Date(2026, 9, 12, 10, 27, 0);
  const prog3 = calcularProgresoEtapa(etapa, f3);
  assert.equal(prog3.fase, "rojo");
});

test("formatearSegundos y formatearTiempoHumano presentan el tiempo de manera legible", () => {
  assert.equal(formatearSegundos(65), "01:05");
  assert.equal(formatearSegundos(0), "00:00");
  assert.equal(formatearSegundos(3665), "1:01:05");

  assert.equal(formatearTiempoHumano(30), "30 seg");
  assert.equal(formatearTiempoHumano(600), "10 min");
  assert.equal(formatearTiempoHumano(4500), "1 h 15 min");
  assert.equal(formatearTiempoHumano(7200), "2 h");
});
