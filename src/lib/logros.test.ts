import test from "node:test";
import assert from "node:assert/strict";
import { evaluarLogros, LOGROS, type DatosLogros } from "./logros.ts";
import type { EstadoHabito } from "./habitos/server.ts";

function fakeHabito(partial: Partial<EstadoHabito>): EstadoHabito {
  return {
    habitoId: 1,
    clave: null,
    nombre: "Test",
    categoria: "orden",
    franja: "manana",
    ancla: "Despues de...",
    icono: "Sparkles",
    dias: 127,
    identidad: "Soy ordenado",
    creadorId: 1,
    activo: true,
    desde: "2026-10-01",
    etapa: "inicio",
    paso: 1,
    pasoActual: { titulo: "Paso 1", diasParaSubir: 7, misterios: 0 },
    pasos: 3,
    seguidos: 0,
    completo: false,
    constancia: 0,
    hoy: null,
    eventos: [],
    recaidaEl: null,
    trayectoria: [],
    programadoHoy: true,
    libro: null,
    libroTerminado: null,
    paginasHoy: null,
    ...partial,
  };
}

test("usuario nuevo sin tareas ni hábitos: ninguno obtenido", () => {
  const d: DatosLogros = {
    usuario: {
      totalTasksCompleted: 0,
      streakDays: 0,
      stars: 0,
      completionPercentage: 0,
      puntosAcumulados: 0,
      experienciaHabitos: 0,
    },
    habitos: [],
  };

  const resultados = evaluarLogros(d);
  assert.equal(resultados.length, LOGROS.length);
  const obtenidos = resultados.filter((r) => r.obtenido);
  assert.equal(obtenidos.length, 0);
});

test("evaluación de tareas y rachas clásicas de BadgesDisplay", () => {
  const d: DatosLogros = {
    usuario: {
      totalTasksCompleted: 15,
      streakDays: 7,
      stars: 12,
      completionPercentage: 85,
      puntosAcumulados: 200,
      experienciaHabitos: 0,
    },
    habitos: [],
  };

  const resultados = evaluarLogros(d);
  const map = new Map(resultados.map((r) => [r.id, r]));

  assert.equal(map.get("racha-3")?.obtenido, true);
  assert.equal(map.get("racha-7")?.obtenido, true);
  assert.equal(map.get("racha-30")?.obtenido, false);
  assert.equal(map.get("tareas-10")?.obtenido, true);
  assert.equal(map.get("tareas-50")?.obtenido, false);
  assert.equal(map.get("estrellas-10")?.obtenido, true);
  assert.equal(map.get("completitud-80")?.obtenido, true);
});

test("logro de nivel considera la suma de puntos y experiencia de hábitos", () => {
  // Nivel 5 requiere 1600 XP
  // 1000 puntos de tareas + 600 experienciaHabitos = 1600 XP -> Nivel 5
  const d: DatosLogros = {
    usuario: {
      puntosAcumulados: 1000,
      experienciaHabitos: 600,
    },
    habitos: [],
  };

  const resultados = evaluarLogros(d);
  const nivel5 = resultados.find((r) => r.id === "nivel-5");
  assert.equal(nivel5?.obtenido, true);
  assert.equal(nivel5?.progreso, 1);
});

test("logros de hábitos: adopción, constancia y etapas", () => {
  const hCama = fakeHabito({
    clave: "cama",
    nombre: "Tender la cama",
    etapa: "firme",
    paso: 3,
    pasos: 3,
    completo: true,
    seguidos: 8,
  });

  const hRopero = fakeHabito({
    clave: "ropero",
    nombre: "Ordenar el ropero",
    etapa: "firme",
  });

  const hRosario = fakeHabito({
    clave: "rosario",
    nombre: "Santo Rosario",
    categoria: "oracion",
    etapa: "firme",
    paso: 15,
    pasos: 15,
    completo: true,
  });

  const d: DatosLogros = {
    usuario: { puntosAcumulados: 0, experienciaHabitos: 100 },
    habitos: [hCama, hRopero, hRosario],
  };

  const resultados = evaluarLogros(d);
  const map = new Map(resultados.map((r) => [r.id, r]));

  assert.equal(map.get("habito-primer")?.obtenido, true);
  assert.equal(map.get("habito-primer-paso")?.obtenido, true);
  assert.equal(map.get("habito-7-dias")?.obtenido, true);
  assert.equal(map.get("habito-firme")?.obtenido, true);
  assert.equal(map.get("habito-3-firmes")?.obtenido, true);
  assert.equal(map.get("habito-escalera")?.obtenido, true);
  assert.equal(map.get("habito-casa-en-orden")?.obtenido, true);
  assert.equal(map.get("habito-rosario")?.obtenido, true);
});

test("logro de 30 noches de Completorium cuenta días con marca hecho", () => {
  const trayectoria = Array.from({ length: 32 }, (_, i) => ({
    fecha: `2026-09-${String(i + 1).padStart(2, "0")}`,
    constancia: 0.9,
    marca: i < 30 ? ("hecho" as const) : ("no" as const),
  }));

  const hComp = fakeHabito({
    clave: "completorium",
    categoria: "oracion",
    trayectoria,
  });

  const d: DatosLogros = {
    usuario: {},
    habitos: [hComp],
  };

  const resultados = evaluarLogros(d);
  const comp30 = resultados.find((r) => r.id === "habito-30-completorium");
  assert.equal(comp30?.obtenido, true);
  assert.equal(comp30?.valorActual, 30);
});

test("ordenamiento: logros obtenidos van al principio", () => {
  const d: DatosLogros = {
    usuario: { streakDays: 5, totalTasksCompleted: 2 },
    habitos: [fakeHabito({ seguidos: 2 })],
  };

  const resultados = evaluarLogros(d);
  // Al menos 'racha-3' y 'habito-primer' están obtenidos
  assert.equal(resultados[0].obtenido, true);
  assert.equal(resultados[1].obtenido, true);

  // Los no obtenidos van después
  const primerNoObtenido = resultados.findIndex((r) => !r.obtenido);
  assert.ok(primerNoObtenido >= 2);
  for (let i = primerNoObtenido; i < resultados.length; i++) {
    assert.equal(resultados[i].obtenido, false);
  }
});
