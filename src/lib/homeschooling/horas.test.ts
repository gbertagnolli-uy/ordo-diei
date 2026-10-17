import { test } from "node:test";
import assert from "node:assert/strict";
import { formatoDuracion, periodoDe, sumarHoras, type ActividadParaHoras, type DiaParaHoras } from "./horas.ts";

const CIENCIAS = { materiaId: 1, materiaNombre: "Ciencias" };
const dia = (o: Partial<DiaParaHoras> = {}): DiaParaHoras => ({
  fecha: "2030-03-12", estado: "hecha", unidadDesde: 1, unidadHasta: 3, minutosPorUnidad: 20, tiempoRealSeg: null, ...CIENCIAS, ...o,
});
const act = (o: Partial<ActividadParaHoras> = {}): ActividadParaHoras => ({
  fecha: "2030-03-12", inicio: new Date("2030-03-12T13:00:00Z"), fin: new Date("2030-03-12T14:30:00Z"), participantes: [10, 11], ...CIENCIAS, ...o,
});
const base = { alumnoId: 10, desde: "2030-03-01", hasta: "2030-03-31" };
const ciencias = (r: ReturnType<typeof sumarHoras>) => r.materias.find((m) => m.materiaId === 1)!;

test("una actividad de 90 min con 2 hijos suma 90 min en Ciencias a cada uno", () => {
  for (const alumnoId of [10, 11]) {
    const r = sumarHoras({ ...base, alumnoId, dias: [], actividades: [act()] });
    assert.equal(ciencias(r).minutosActividades, 90);
    assert.equal(r.totales.actividades, 1);
  }
});

test("una actividad con 3 participantes suma a los 3, y no a quien no participó", () => {
  const a = act({ participantes: [10, 11, 12] });
  for (const alumnoId of [10, 11, 12]) assert.equal(ciencias(sumarHoras({ ...base, alumnoId, dias: [], actividades: [a] })).minutosActividades, 90);
  assert.equal(sumarHoras({ ...base, alumnoId: 99, dias: [], actividades: [a] }).materias.length, 0);
});

test("día hecho con tiempo real 1500 s → 25 min", () => {
  assert.equal(ciencias(sumarHoras({ ...base, dias: [dia({ tiempoRealSeg: 1500 })], actividades: [] })).minutosLecciones, 25);
});

test("día hecho sin tiempo real (0 o null): 3 unidades × 20 min = 60 min", () => {
  for (const t of [0, null]) assert.equal(ciencias(sumarHoras({ ...base, dias: [dia({ tiempoRealSeg: t })], actividades: [] })).minutosLecciones, 60);
});

test("pendiente, movida y omitida no suman horas; movida tampoco cuenta como planificada", () => {
  const r = sumarHoras({ ...base, dias: [dia({ estado: "pendiente" }), dia({ estado: "movida" }), dia({ estado: "omitida" })], actividades: [] });
  assert.equal(ciencias(r).minutosLecciones, 0);
  assert.equal(ciencias(r).leccionesPlanificadas, 6); // pendiente + omitida; la movida se reprogramó en otro día
  assert.equal(ciencias(r).leccionesHechas, 0);
});

test("fuera del período no suma (días ni actividades)", () => {
  const r = sumarHoras({ ...base, dias: [dia({ fecha: "2030-04-02" })], actividades: [act({ fecha: "2030-02-28" })] });
  assert.equal(r.materias.length, 0);
  assert.equal(r.totales.minutos, 0);
});

test("mezcla: lecciones y actividades suman en la misma materia; promedio de notas", () => {
  const r = sumarHoras({ ...base, dias: [dia()], actividades: [act()], notas: [{ materiaId: 1, nota: 80 }, { materiaId: 1, nota: 100 }, { materiaId: 2, nota: 10 }] });
  assert.equal(ciencias(r).minutosTotal, 150);
  assert.equal(ciencias(r).leccionesHechas, 3);
  assert.equal(ciencias(r).promedioNotas, 90);
  assert.equal(r.totales.minutos, 150);
});

test("formatoDuracion y periodoDe", () => {
  assert.equal(formatoDuracion(45), "45 min");
  assert.equal(formatoDuracion(90), "1 h 30 min");
  assert.equal(formatoDuracion(120), "2 h");
  assert.deepEqual(periodoDe("mes", "2030-02-15"), { desde: "2030-02-01", hasta: "2030-02-28" });
  assert.deepEqual(periodoDe("trimestre", "2030-05-10"), { desde: "2030-04-01", hasta: "2030-06-30" });
  assert.deepEqual(periodoDe("anio", "2030-10-14"), { desde: "2030-03-01", hasta: "2031-02-28" });
  assert.deepEqual(periodoDe("anio", "2031-01-10"), { desde: "2030-03-01", hasta: "2031-02-28" });
});
