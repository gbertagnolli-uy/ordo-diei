import test from "node:test";
import assert from "node:assert/strict";
import {
  horaAMinutos,
  minutosAHora,
  esDiaAplicable,
  estaEnIntervalo,
  duracionEtapaSegundos,
  obtenerEtapaActual,
  obtenerProximaEtapa,
  calcularProgresoEtapa,
  formatearSegundos,
  formatearTiempoHumano,
  posponerRutina,
  posponerDesdeEtapa,
  extenderEtapaActiva,
  calcularTermometroEjecucion,
  avanzarEtapaAhora,
  retrocederEtapaAhora,
  obtenerEtapaAnterior,
  obtenerEtapaSiguiente,
} from "./calculadorHorarios.ts";
import { RUTINA_PREDETERMINADA } from "./tipos.ts";

test("horaAMinutos convierte correctamente strings HH:mm", () => {
  assert.equal(horaAMinutos("00:00"), 0);
  assert.equal(horaAMinutos("08:00"), 480);
  assert.equal(horaAMinutos("08:15"), 495);
  assert.equal(horaAMinutos("12:00"), 720);
  assert.equal(horaAMinutos("23:59"), 1439);
});

test("minutosAHora formatea minutos a HH:mm normalizado", () => {
  assert.equal(minutosAHora(0), "00:00");
  assert.equal(minutosAHora(495), "08:15");
  assert.equal(minutosAHora(720), "12:00");
  assert.equal(minutosAHora(1445), "00:05"); // wrap medianoche
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
  assert.equal(estaEnIntervalo(1320, "22:00", "08:00"), true);
  assert.equal(estaEnIntervalo(1400, "22:00", "08:00"), true);
  assert.equal(estaEnIntervalo(100, "22:00", "08:00"), true);
  assert.equal(estaEnIntervalo(479, "22:00", "08:00"), true);
  assert.equal(estaEnIntervalo(480, "22:00", "08:00"), false);
});

test("duracionEtapaSegundos calcula la duración precisa", () => {
  assert.equal(duracionEtapaSegundos("08:00", "08:15"), 15 * 60);
  assert.equal(duracionEtapaSegundos("09:00", "09:25"), 25 * 60);
  assert.equal(duracionEtapaSegundos("10:20", "12:00"), 100 * 60);
  assert.equal(duracionEtapaSegundos("22:00", "08:00"), 600 * 60);
});

test("obtenerEtapaActual detecta la etapa correspondiente a la hora del día", () => {
  const fechaManana = new Date(2026, 9, 12, 8, 10, 0); // Lunes
  const actual = obtenerEtapaActual(RUTINA_PREDETERMINADA, fechaManana);
  assert.ok(actual.etapa);
  assert.equal(actual.etapa?.id, "etapa-01");

  const fechaMediodia = new Date(2026, 9, 12, 12, 15, 0);
  const actualMediodia = obtenerEtapaActual(RUTINA_PREDETERMINADA, fechaMediodia);
  assert.equal(actualMediodia.etapa?.id, "etapa-12");

  const fechaNoche = new Date(2026, 9, 12, 23, 30, 0);
  const actualNoche = obtenerEtapaActual(RUTINA_PREDETERMINADA, fechaNoche);
  assert.equal(actualNoche.etapa?.id, "etapa-28");
});

test("obtenerProximaEtapa entrega la siguiente etapa y el tiempo que falta", () => {
  const fecha = new Date(2026, 9, 12, 8, 10, 0);
  const prox = obtenerProximaEtapa(RUTINA_PREDETERMINADA, fecha);
  assert.ok(prox.etapa);
  assert.equal(prox.etapa?.id, "etapa-02");
  assert.equal(prox.restanteSeg, 5 * 60);
});

test("calcularProgresoEtapa calcula ratioRestante continuo y fases", () => {
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

  const f1 = new Date(2026, 9, 12, 10, 5, 0);
  const prog1 = calcularProgresoEtapa(etapa, f1);
  assert.equal(prog1.totalSeg, 1800);
  assert.equal(prog1.transcurridoSeg, 300);
  assert.equal(prog1.restanteSeg, 1500);
  assert.ok(prog1.ratioRestante > 0.8 && prog1.ratioRestante < 0.84);
  assert.equal(prog1.fase, "verde");

  const f2 = new Date(2026, 9, 12, 10, 20, 0);
  const prog2 = calcularProgresoEtapa(etapa, f2);
  assert.equal(prog2.fase, "ambar");

  const f3 = new Date(2026, 9, 12, 10, 27, 0);
  const prog3 = calcularProgresoEtapa(etapa, f3);
  assert.equal(prog3.fase, "rojo");
});

test("posponerRutina desplaza en cascada las etapas posteriores", () => {
  const etapasTest = [
    { ...RUTINA_PREDETERMINADA[11], horaInicio: "12:00", horaFin: "12:40" },
    { ...RUTINA_PREDETERMINADA[12], horaInicio: "12:40", horaFin: "13:15" },
    { ...RUTINA_PREDETERMINADA[13], horaInicio: "13:15", horaFin: "13:40" },
  ];

  // Si a las 13:00 posponemos +10 minutos
  const pospuestas = posponerRutina(etapasTest, 10, "13:00");

  // La que estaba antes de 13:00 (12:00 a 12:40) no cambia
  assert.equal(pospuestas[0].horaInicio, "12:00");
  assert.equal(pospuestas[0].horaFin, "12:40");

  // La que estaba en curso (12:40 a 13:15) extiende su fin a 13:25
  assert.equal(pospuestas[1].horaInicio, "12:40");
  assert.equal(pospuestas[1].horaFin, "13:25");

  // La siguiente (13:15 a 13:40) se traslada completa a 13:25 a 13:50
  assert.equal(pospuestas[2].horaInicio, "13:25");
  assert.equal(pospuestas[2].horaFin, "13:50");
});

test("calcularTermometroEjecucion mide el ritmo según la hora presente", () => {
  // A las 09:10: deberían haberse completado etapa 1 (08:00-08:15), 2 (08:15-08:20), 3 (08:20-08:30) y 4 (08:30-09:00)
  const fecha = new Date(2026, 9, 12, 9, 10, 0); // Lunes 09:10
  const completadas = new Set(["etapa-01", "etapa-02", "etapa-03", "etapa-04", "etapa-05"]);

  const ritmo = calcularTermometroEjecucion(RUTINA_PREDETERMINADA, completadas, fecha);
  assert.equal(ritmo.estado, "impecable");
  assert.equal(ritmo.porcentajeRitmo, 100);

  // Si solo completaron 2 de las esperadas
  const pocas = new Set(["etapa-01", "etapa-02"]);
  const ritmoBajo = calcularTermometroEjecucion(RUTINA_PREDETERMINADA, pocas, fecha);
  assert.equal(ritmoBajo.estado, "demorado");
  assert.ok(ritmoBajo.porcentajeRitmo < 60);
});

test("posponerDesdeEtapa extiende la etapa previa y desplaza las posteriores", () => {
  const etapasTest = [
    { ...RUTINA_PREDETERMINADA[11], id: "et-1", horaInicio: "12:00", horaFin: "12:40" },
    { ...RUTINA_PREDETERMINADA[12], id: "et-2", horaInicio: "12:40", horaFin: "13:15" },
    { ...RUTINA_PREDETERMINADA[13], id: "et-3", horaInicio: "13:15", horaFin: "13:40" },
  ];

  // Si a las 12:40 suena la alarma de et-2 y se pospone +5 min
  const res = posponerDesdeEtapa(etapasTest, "et-2", 5, true);

  // La etapa anterior (et-1) se extiende a 12:45
  assert.equal(res[0].horaInicio, "12:00");
  assert.equal(res[0].horaFin, "12:45");

  // La etapa pospuesta (et-2) ahora arranca a las 12:45 y finaliza a las 13:20
  assert.equal(res[1].horaInicio, "12:45");
  assert.equal(res[1].horaFin, "13:20");

  // La posterior (et-3) se corre a 13:20 - 13:45
  assert.equal(res[2].horaInicio, "13:20");
  assert.equal(res[2].horaFin, "13:45");
});

test("extenderEtapaActiva alarga la etapa en curso y desplaza las siguientes", () => {
  const etapasTest = [
    { ...RUTINA_PREDETERMINADA[4], id: "estudio-1", horaInicio: "09:00", horaFin: "09:25" },
    { ...RUTINA_PREDETERMINADA[5], id: "pausa-1", horaInicio: "09:25", horaFin: "09:30" },
    { ...RUTINA_PREDETERMINADA[6], id: "estudio-2", horaInicio: "09:30", horaFin: "09:55" },
  ];

  // Usuario pide +5 min en estudio-1
  const res = extenderEtapaActiva(etapasTest, "estudio-1", 5);

  // estudio-1 dura 5 min más (hasta 09:30)
  assert.equal(res[0].horaInicio, "09:00");
  assert.equal(res[0].horaFin, "09:30");

  // pausa-1 se desplaza a 09:30 - 09:35
  assert.equal(res[1].horaInicio, "09:30");
  assert.equal(res[1].horaFin, "09:35");

  // estudio-2 se desplaza a 09:35 - 10:00
  assert.equal(res[2].horaInicio, "09:35");
  assert.equal(res[2].horaFin, "10:00");
});


test("termómetro: un atraso parcial no es 0% y pondera por minutos desde el inicio del día", () => {
  // 10:30 del lunes: ya terminaron las etapas 1..10 (08:00-10:20 aprox.)
  const fecha = new Date(2026, 9, 12, 10, 30, 0);
  // Solo se cumplieron las 4 primeras (08:00-09:00 = 60 min de ~140 transcurridos)
  const parcial = new Set(["etapa-01", "etapa-02", "etapa-03", "etapa-04"]);
  const r = calcularTermometroEjecucion(RUTINA_PREDETERMINADA, parcial, fecha);
  assert.ok(r.porcentajeRitmo > 0 && r.porcentajeRitmo < 100);
  assert.equal(r.estado, "demorado");
  assert.equal(r.minutosCompletados, 60);
  assert.ok(r.minutosEsperados > r.minutosCompletados);
});

test("termómetro: la etapa en curso sin marcar no cuenta como atraso", () => {
  const fecha = new Date(2026, 9, 12, 9, 10, 0); // etapa 5 (09:00-09:25) en curso
  const hechas = new Set(["etapa-01", "etapa-02", "etapa-03", "etapa-04"]);
  const r = calcularTermometroEjecucion(RUTINA_PREDETERMINADA, hechas, fecha);
  assert.equal(r.estado, "impecable");
  assert.equal(r.porcentajeRitmo, 100);
});

test("termómetro: antes de comenzar el día queda en 'por_comenzar'", () => {
  const fecha = new Date(2026, 9, 12, 7, 0, 0);
  const r = calcularTermometroEjecucion(RUTINA_PREDETERMINADA, new Set(), fecha);
  assert.equal(r.estado, "por_comenzar");
});

const BASE_NAV = [
  { ...RUTINA_PREDETERMINADA[4], id: "n-1", horaInicio: "09:00", horaFin: "09:25", duracionMin: 25 },
  { ...RUTINA_PREDETERMINADA[5], id: "n-2", horaInicio: "09:25", horaFin: "09:30", duracionMin: 5 },
  { ...RUTINA_PREDETERMINADA[6], id: "n-3", horaInicio: "09:30", horaFin: "09:55", duracionMin: 25 },
];

test("avanzarEtapaAhora termina la etapa en este minuto y adelanta el resto", () => {
  const fecha = new Date(2026, 9, 12, 9, 10, 30); // dentro de n-1
  const res = avanzarEtapaAhora(BASE_NAV, fecha);
  assert.equal(res[0].horaFin, "09:10");
  assert.equal(res[0].duracionMin, 10);
  assert.equal(res[1].horaInicio, "09:10");
  assert.equal(res[1].horaFin, "09:15");
  assert.equal(res[2].horaInicio, "09:15");
  assert.equal(obtenerEtapaActual(res, fecha).etapa?.id, "n-2");
});

test("avanzarEtapaAhora no hace nada en la última etapa del día", () => {
  const fecha = new Date(2026, 9, 12, 9, 40, 0); // n-3 es la última
  assert.equal(avanzarEtapaAhora(BASE_NAV, fecha), BASE_NAV);
  assert.equal(obtenerEtapaSiguiente(BASE_NAV, fecha), null);
});

test("retrocederEtapaAhora reinicia la etapa anterior y corre el resto", () => {
  const fecha = new Date(2026, 9, 12, 9, 26, 0); // dentro de n-2 (pausa)
  assert.equal(obtenerEtapaAnterior(BASE_NAV, fecha)?.id, "n-1");
  const res = retrocederEtapaAhora(BASE_NAV, fecha);
  // n-1 (25 min) se retoma ahora con un máximo de 15 min
  assert.equal(res[0].horaInicio, "09:26");
  assert.equal(res[0].horaFin, "09:41");
  // n-2 y n-3 conservan su duración, corridas detrás de n-1
  assert.equal(res[1].horaInicio, "09:41");
  assert.equal(res[1].horaFin, "09:46");
  assert.equal(res[2].horaInicio, "09:46");
  assert.equal(res[2].horaFin, "10:11");
  assert.equal(obtenerEtapaActual(res, fecha).etapa?.id, "n-1");
});

test("retrocederEtapaAhora no hace nada en la primera etapa del día", () => {
  const fecha = new Date(2026, 9, 12, 9, 10, 0);
  assert.equal(retrocederEtapaAhora(BASE_NAV, fecha), BASE_NAV);
});

test("el cambio de etapa y el cero del temporizador ocurren en el mismo instante", () => {
  // Justo antes y justo en el límite 09:25
  const antes = new Date(2026, 9, 12, 9, 24, 59, 500);
  const ahora = new Date(2026, 9, 12, 9, 25, 0, 0);
  const e1 = obtenerEtapaActual(BASE_NAV, antes).etapa!;
  assert.equal(e1.id, "n-1");
  assert.equal(calcularProgresoEtapa(e1, antes).restanteSeg, 1);
  const e2 = obtenerEtapaActual(BASE_NAV, ahora).etapa!;
  assert.equal(e2.id, "n-2");
  assert.equal(calcularProgresoEtapa(e1, ahora).restanteSeg, 0);
});
